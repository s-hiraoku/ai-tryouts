#!/usr/bin/env python3

import hashlib
import json
import math
import os
import re
import shutil
import struct
import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"
SKILL = Path(os.environ.get("FFMPEG_SKILL_DIR", Path.home() / ".claude/skills/ffmpeg-skill"))
RESULTS = ROOT / "results.json"

FIXTURE_SECONDS = 16.0
WIDTH = 1280
HEIGHT = 720
FPS = 30
SAMPLE_RATE = 48000
DURATION_TOLERANCE_S = 3 / FPS
GAIN_DB = 6.0
GAIN_TOLERANCE_DB = 1.0
MARKER_SEPARATION_DB = 12.0
MARKER_MATCH_DB = 6.0
SILENCE_NOISE_DB = -35
MARKER_END_S = 0.20
TONE_440_END_S = 4.00
SILENCE_END_S = 8.00
TONE_880_END_S = 12.00
SILENCE_GAP_S = SILENCE_END_S - TONE_440_END_S
SILENCE_REMOVED_MIN_S = SILENCE_GAP_S - 1.0
LONG_SILENCE_S = 1.0


def even_dimension(value):
    rounded = int(round(value))
    return rounded if rounded % 2 == 0 else rounded + 1


EXPECT_PORTRAIT = (even_dimension(HEIGHT * 9 / 16), even_dimension(HEIGHT))


def run(cmd, timeout=180):
    proc = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=timeout)
    return proc.returncode, proc.stdout, proc.stderr


def parse_db(text, key):
    match = re.search(rf"{key}:\s*(-?[\d.]+|inf|-inf)\s*dB", text)
    if not match:
        return None
    raw = match.group(1)
    if raw == "-inf":
        return -120.0
    if raw == "inf":
        return 120.0
    return float(raw)


def ffprobe(path):
    code, stdout, stderr = run([
        "ffprobe", "-v", "error", "-print_format", "json",
        "-show_format", "-show_streams", str(path),
    ])
    if code != 0:
        return {"error": stderr.strip()[-500:]}
    doc = json.loads(stdout)
    fmt = doc.get("format") or {}
    video = next((s for s in doc.get("streams") or [] if s.get("codec_type") == "video"), {})
    audio = next((s for s in doc.get("streams") or [] if s.get("codec_type") == "audio"), {})
    rate = video.get("avg_frame_rate") or "0/1"
    num, den = rate.split("/")
    fps = float(num) / float(den) if den not in ("0", "") else None
    duration = float(fmt["duration"]) if fmt.get("duration") else None

    def timed(stream, key):
        raw = stream.get(key)
        return None if raw is None else round(float(raw), 3)

    return {
        "duration_s": None if duration is None else round(duration, 3),
        "width": video.get("width"),
        "height": video.get("height"),
        "fps": None if fps is None else round(fps, 3),
        "video_codec": video.get("codec_name"),
        "video_duration_s": timed(video, "duration"),
        "video_start_s": timed(video, "start_time"),
        "audio_codec": audio.get("codec_name"),
        "audio_duration_s": timed(audio, "duration"),
        "audio_start_s": timed(audio, "start_time"),
        "channels": audio.get("channels"),
        "sample_rate": audio.get("sample_rate"),
        "nb_streams": len(doc.get("streams") or []),
    }


def volumedetect(path):
    code, _stdout, stderr = run([
        "ffmpeg", "-hide_banner", "-i", str(path),
        "-af", "volumedetect", "-f", "null", "-",
    ])
    return {
        "exit_code": code,
        "mean_volume_db": parse_db(stderr, "mean_volume"),
        "max_volume_db": parse_db(stderr, "max_volume"),
    }


def band_mean_db(path, start, end, freq=2000):
    code, _stdout, stderr = run([
        "ffmpeg", "-hide_banner", "-i", str(path),
        "-af",
        f"atrim=start={start}:end={end},asetpts=PTS-STARTPTS,"
        f"bandpass=f={freq}:width_type=h:w=80,volumedetect",
        "-f", "null", "-",
    ])
    return {"exit_code": code, "mean_volume_db": parse_db(stderr, "mean_volume")}


def silence_durations(path):
    _code, _stdout, stderr = run([
        "ffmpeg", "-hide_banner", "-i", str(path),
        "-af", f"silencedetect=n={SILENCE_NOISE_DB}dB:d=0.8",
        "-f", "null", "-",
    ])
    return [float(v) for v in re.findall(r"silence_duration:\s*([\d.]+)", stderr)]


def keyframe_times(path, limit=24):
    _code, stdout, _stderr = run([
        "ffprobe", "-v", "error", "-select_streams", "v:0", "-skip_frame", "nokey",
        "-show_entries", "frame=pts_time", "-of", "csv=p=0", str(path),
    ])
    times = []
    for line in stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        times.append(round(float(line.split(",")[0]), 3))
        if len(times) >= limit:
            break
    return times


def write_tone(path):
    # 0.00-0.20 s is a 2 kHz marker. A cut that starts at 0.40 s must not keep it.
    # 0.20-4.00 s is 440 Hz, 4.00-8.00 s is digital silence, then 880 Hz and 330 Hz.
    frames = bytearray()
    count = int(SAMPLE_RATE * FIXTURE_SECONDS)
    for i in range(count):
        t = i / SAMPLE_RATE
        if t < MARKER_END_S:
            sample = 0.1 * math.sin(2 * math.pi * 2000 * t)
        elif t < TONE_440_END_S:
            sample = 0.1 * math.sin(2 * math.pi * 440 * t)
        elif t < SILENCE_END_S:
            sample = 0.0
        elif t < TONE_880_END_S:
            sample = 0.1 * math.sin(2 * math.pi * 880 * t)
        else:
            sample = 0.1 * math.sin(2 * math.pi * 330 * t)
        value = int(max(-1.0, min(1.0, sample)) * 32767)
        frames += struct.pack("<hh", value, value)
    with wave.open(str(path), "w") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(frames)


def build_fixture():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    tone = OUT / "tone.wav"
    fixture = OUT / "fixture.mp4"
    write_tone(tone)
    code, _stdout, stderr = run([
        "ffmpeg", "-y", "-hide_banner",
        "-f", "lavfi", "-i", f"testsrc2=size={WIDTH}x{HEIGHT}:rate={FPS}:duration={FIXTURE_SECONDS}",
        "-i", str(tone),
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-g", "30", "-keyint_min", "30", "-sc_threshold", "0",
        "-c:a", "aac", "-b:a", "160k", "-ar", str(SAMPLE_RATE), "-ac", "2",
        "-t", str(FIXTURE_SECONDS), "-movflags", "+faststart",
        str(fixture),
    ], timeout=120)
    if code != 0:
        raise SystemExit(f"fixture encode failed\n{stderr[-800:]}")
    tone.unlink()
    return fixture


def load_json(text):
    text = text.strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        if start < 0:
            return None
        try:
            return json.JSONDecoder().raw_decode(text[start:])[0]
        except json.JSONDecodeError:
            return None


def slim(doc):
    if not isinstance(doc, dict):
        return doc
    drop = {"probe", "commands"}
    return {key: value for key, value in doc.items() if key not in drop}


def tool_json_from_stdout(stdout, interface):
    doc = load_json(stdout)
    if interface == "mcp" and isinstance(doc, dict) and "structuredContent" in doc:
        return doc["structuredContent"]
    return doc


def marker_state(measured, loud, quiet):
    if measured is None or loud is None or quiet is None:
        return "inconclusive"
    if loud - quiet < MARKER_SEPARATION_DB:
        return "inconclusive"
    if measured >= loud - MARKER_MATCH_DB:
        return "present"
    if measured <= quiet + MARKER_MATCH_DB:
        return "absent"
    return "inconclusive"


def duration_state(measured, expected):
    if measured is None or expected is None:
        return "inconclusive"
    return "match" if abs(measured - expected) <= DURATION_TOLERANCE_S else "miss"


def run_skill(script, args):
    path = SKILL / "scripts" / script
    code, stdout, stderr = run([sys.executable, str(path), *args], timeout=180)
    return code, tool_json_from_stdout(stdout, "skill"), stderr


def run_mcp(name, arguments):
    server = SKILL / "mcp" / "server.py"
    code, stdout, stderr = run([
        sys.executable, str(server), "--call", name, json.dumps(arguments),
    ], timeout=180)
    return code, tool_json_from_stdout(stdout, "mcp"), stderr


def rel(path):
    return str(path.relative_to(ROOT))


def evaluate(name, interface, command, code, doc, stderr, expect, fixture_info):
    probed = ffprobe(OUT / f"{name}.mp4") if (OUT / f"{name}.mp4").exists() else {"error": "missing"}
    measured_duration = probed.get("duration_s")
    duration = duration_state(measured_duration, expect.get("duration_s"))
    marker = None
    if expect.get("marker") is not None and (OUT / f"{name}.mp4").exists():
        window = band_mean_db(OUT / f"{name}.mp4", 0.0, 0.25)
        marker = marker_state(
            window["mean_volume_db"],
            fixture_info["marker_loud_db"],
            fixture_info["marker_quiet_db"],
        )
        marker = {"state": marker, "mean_volume_db": window["mean_volume_db"]}
    silence = None
    if expect.get("silence_removed"):
        spans = silence_durations(OUT / f"{name}.mp4") if (OUT / f"{name}.mp4").exists() else []
        longest = max(spans) if spans else 0.0
        source_duration = fixture_info["probe"]["duration_s"]
        removed = None if measured_duration is None else round(source_duration - measured_duration, 3)
        silence = {
            "longest_silence_s": round(longest, 3),
            "removed_s": removed,
            "ok": longest < LONG_SILENCE_S and removed is not None and removed >= SILENCE_REMOVED_MIN_S,
        }
    size = None
    if expect.get("size"):
        got = (probed.get("width"), probed.get("height"))
        size = {"expected": list(expect["size"]), "got": list(got), "ok": got == expect["size"]}
    gain = None
    if expect.get("gain_db") is not None and (OUT / f"{name}.mp4").exists():
        levels = volumedetect(OUT / f"{name}.mp4")
        source = fixture_info["volume"]
        mean_delta = None
        max_delta = None
        if levels["mean_volume_db"] is not None and source["mean_volume_db"] is not None:
            mean_delta = round(levels["mean_volume_db"] - source["mean_volume_db"], 2)
        if levels["max_volume_db"] is not None and source["max_volume_db"] is not None:
            max_delta = round(levels["max_volume_db"] - source["max_volume_db"], 2)
        gain = {
            "mean_delta_db": mean_delta,
            "max_delta_db": max_delta,
            "mean_volume_db": levels["mean_volume_db"],
            "max_volume_db": levels["max_volume_db"],
            "ok": (
                mean_delta is not None and max_delta is not None
                and abs(mean_delta - expect["gain_db"]) <= GAIN_TOLERANCE_DB
                and abs(max_delta - expect["gain_db"]) <= GAIN_TOLERANCE_DB
            ),
        }
    parts = []
    if expect.get("duration_s") is not None:
        parts.append({"match": "pass", "miss": "fail"}.get(duration, "inconclusive"))
    if marker is not None:
        if marker["state"] == "inconclusive":
            parts.append("inconclusive")
        else:
            parts.append("pass" if marker["state"] == expect["marker"] else "fail")
    if silence is not None:
        parts.append("inconclusive" if silence["removed_s"] is None else ("pass" if silence["ok"] else "fail"))
    if size is not None:
        parts.append("pass" if size["ok"] else "fail")
    if gain is not None:
        if gain["mean_delta_db"] is None or gain["max_delta_db"] is None:
            parts.append("inconclusive")
        else:
            parts.append("pass" if gain["ok"] else "fail")
    if any(part == "fail" for part in parts):
        reality = "fail"
    elif any(part == "inconclusive" for part in parts) or not parts:
        reality = "inconclusive"
    else:
        reality = "pass"
    verified = None if not isinstance(doc, dict) else doc.get("verified")
    agrees = None
    if verified is not None and reality in ("pass", "fail"):
        agrees = (verified is True and reality == "pass") or (verified is False and reality == "fail")
    broken_while_verified = bool(
        expect.get("kind") == "cut" and verified is True and reality == "fail"
    )
    marker_kept_while_verified = bool(
        verified is True and expect.get("marker") == "absent"
        and marker is not None and marker["state"] == "present"
    )
    tail = "\n".join(stderr.strip().splitlines()[-12:]) if code != 0 else ""
    return {
        "name": name,
        "interface": interface,
        "command": command,
        "exit_code": code,
        "tool": slim(doc) if isinstance(doc, dict) else {"unparsed": True},
        "ffprobe": probed,
        "duration_check": duration,
        "marker": marker,
        "silence": silence,
        "size": size,
        "gain": gain,
        "reality": reality,
        "verified": verified,
        "verified_agrees": agrees,
        "broken_while_verified": broken_while_verified,
        "marker_kept_while_verified": marker_kept_while_verified,
        "stderr_tail": tail,
    }


def main():
    if not (SKILL / "scripts" / "cut.py").is_file():
        raise SystemExit(f"skill scripts missing at {SKILL}. Run npx ffmpeg-skill first.")
    version = json.loads((SKILL / "package.json").read_text())["version"]
    fixture = build_fixture()
    probe = ffprobe(fixture)
    loud = band_mean_db(fixture, 0.0, 0.25)
    quiet = band_mean_db(fixture, 0.40, 0.65)
    volume = volumedetect(fixture)
    silences = silence_durations(fixture)
    keys = keyframe_times(fixture)
    fixture_info = {
        "probe": probe,
        "marker_loud_db": loud["mean_volume_db"],
        "marker_quiet_db": quiet["mean_volume_db"],
        "volume": volume,
        "silence_durations_s": [round(v, 3) for v in silences],
        "keyframes_s": keys,
    }
    separation = None
    if loud["mean_volume_db"] is not None and quiet["mean_volume_db"] is not None:
        separation = round(loud["mean_volume_db"] - quiet["mean_volume_db"], 2)
    fixture_ok = (
        probe.get("width") == WIDTH and probe.get("height") == HEIGHT
        and probe.get("duration_s") is not None
        and abs(probe["duration_s"] - FIXTURE_SECONDS) <= DURATION_TOLERANCE_S
        and probe.get("video_codec") == "h264" and probe.get("audio_codec") == "aac"
        and silences and max(silences) >= 3.5
        and separation is not None and separation >= MARKER_SEPARATION_DB
    )
    fixture_rel = rel(fixture)
    trials = []

    def skill_trial(name, script, extra, expect):
        output = OUT / f"{name}.mp4"
        args = [fixture_rel, *extra, "-o", rel(output), "--json"]
        code, doc, stderr = run_skill(script, args)
        command = " ".join([sys.executable, str(SKILL / "scripts" / script), *args])
        trials.append(evaluate(name, "skill", command, code, doc, stderr, expect, fixture_info))

    skill_trial("cut_on_keyframe", "cut.py", ["--start", "2", "--end", "5"], {
        "kind": "cut", "duration_s": 3.0, "marker": "absent",
    })
    skill_trial("cut_off_keyframe", "cut.py", ["--start", "0.40", "--end", "6"], {
        "kind": "cut", "duration_s": 5.6, "marker": "absent",
    })
    skill_trial("cut_off_keyframe_repeat", "cut.py", ["--start", "0.40", "--end", "6"], {
        "kind": "cut", "duration_s": 5.6, "marker": "absent",
    })
    skill_trial("cut_accurate", "cut.py", ["--start", "0.40", "--end", "6", "--accurate"], {
        "kind": "cut", "duration_s": 5.6, "marker": "absent",
    })
    skill_trial("cut_segments", "cut.py", ["--segments", "0.40-2.40,8.40-11.40"], {
        "kind": "cut", "duration_s": 5.0, "marker": "absent",
    })
    skill_trial("silence", "silence.py", [], {
        "kind": "silence", "silence_removed": True,
    })
    skill_trial("portrait", "fit.py", ["--aspect", "9:16", "--fit", "crop"], {
        "kind": "fit", "duration_s": FIXTURE_SECONDS, "size": EXPECT_PORTRAIT,
    })
    skill_trial("gain", "audio.py", ["--gain", str(GAIN_DB)], {
        "kind": "gain", "duration_s": FIXTURE_SECONDS, "gain_db": GAIN_DB,
    })

    look_code, look_doc, look_err = run_skill("look.py", [
        rel(OUT / "portrait.mp4"), "--tiles", "3x2", "-o", rel(OUT / "portrait_look.png"), "--json",
    ])
    mcp_code, mcp_doc, mcp_err = run_mcp("cut", {
        "input": fixture_rel,
        "start": "0.40",
        "end": "6",
        "output": rel(OUT / "cut_mcp.mp4"),
    })
    trials.append(evaluate(
        "cut_mcp", "mcp",
        f"{sys.executable} {SKILL / 'mcp' / 'server.py'} --call cut",
        mcp_code, mcp_doc, mcp_err,
        {"kind": "cut", "duration_s": 5.6, "marker": "absent"},
        fixture_info,
    ))

    bug = [row["name"] for row in trials if row["broken_while_verified"]]
    marker_kept = [row["name"] for row in trials if row["marker_kept_while_verified"]]
    digest = {}
    for name in ("cut_off_keyframe", "cut_off_keyframe_repeat", "cut_mcp"):
        path = OUT / f"{name}.mp4"
        if path.exists():
            digest[name] = hashlib.sha256(path.read_bytes()).hexdigest()
    segments = OUT / "cut_segments.mp4"
    second_span = None
    if segments.exists():
        second_span = {
            "window_s": [2.2, 2.7],
            "hz_880_mean_db": band_mean_db(segments, 2.2, 2.7, 880)["mean_volume_db"],
            "hz_440_mean_db": band_mean_db(segments, 2.2, 2.7, 440)["mean_volume_db"],
        }
    repeat = [row for row in trials if row["name"] in ("cut_off_keyframe", "cut_off_keyframe_repeat")]
    spread = None
    if all(row["ffprobe"].get("duration_s") is not None for row in repeat):
        spread = round(abs(repeat[0]["ffprobe"]["duration_s"] - repeat[1]["ffprobe"]["duration_s"]), 3)
    payload = {
        "skill_version": version,
        "install_command": "npx ffmpeg-skill",
        "install_path": str(SKILL),
        "interface_for_the_four_operations": "skill",
        "mcp_note": "cut_mcp repeats the off-keyframe cut through mcp/server.py --call",
        "ffmpeg": subprocess.check_output(["ffmpeg", "-version"], text=True).splitlines()[0],
        "thresholds": {
            "duration_tolerance_s": DURATION_TOLERANCE_S,
            "gain_db": GAIN_DB,
            "gain_tolerance_db": GAIN_TOLERANCE_DB,
            "marker_separation_db": MARKER_SEPARATION_DB,
            "marker_match_db": MARKER_MATCH_DB,
            "silence_removed_min_s": SILENCE_REMOVED_MIN_S,
            "long_silence_s": LONG_SILENCE_S,
            "portrait": list(EXPECT_PORTRAIT),
        },
        "fixture_ok": fixture_ok,
        "fixture": fixture_info,
        "marker_separation_db": separation,
        "off_keyframe_duration_spread_s": spread,
        "look": {
            "exit_code": look_code,
            "output": rel(OUT / "portrait_look.png"),
            "verified": None if not isinstance(look_doc, dict) else look_doc.get("verified"),
            "stderr_tail": "\n".join(look_err.strip().splitlines()[-8:]) if look_code != 0 else "",
        },
        "request_miss_while_verified": bug,
        "marker_kept_while_verified": marker_kept,
        "off_keyframe_sha256": digest,
        "segments_second_span": second_span,
        "trials": trials,
    }
    RESULTS.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({
        "fixture_ok": fixture_ok,
        "marker_separation_db": separation,
        "request_miss_while_verified": bug,
        "marker_kept_while_verified": marker_kept,
        "rows": [
            {
                "name": row["name"],
                "interface": row["interface"],
                "exit": row["exit_code"],
                "verified": row["verified"],
                "reality": row["reality"],
                "agrees": row["verified_agrees"],
                "duration_s": row["ffprobe"].get("duration_s"),
                "size": [row["ffprobe"].get("width"), row["ffprobe"].get("height")],
            }
            for row in trials
        ],
    }, indent=2))
    if not fixture_ok:
        raise SystemExit("fixture failed its own checks")


if __name__ == "__main__":
    main()
