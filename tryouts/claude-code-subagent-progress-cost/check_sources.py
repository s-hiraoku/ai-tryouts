#!/usr/bin/env python3

import argparse
import json
import os
import shutil
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone, timedelta

CHANGELOG_URL = (
    "https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md"
)
PHRASES = ("99%", "short notes", "Haiku 5.5 writes")
JST = timezone(timedelta(hours=9))


def scan(text):
    return {phrase: phrase in text for phrase in PHRASES}


def heading_present(text):
    return "## 2.1.316" in text


def report_lines(text, source):
    found = scan(text)
    lines = [
        f"changelog_source: {source}",
        "heading_2.1.316: " + ("ある" if heading_present(text) else "無い"),
    ]
    for phrase in PHRASES:
        lines.append(f"phrase {phrase}: " + ("ある" if found[phrase] else "無い"))
    lines.append("判定: リリースノート上は未確認。語句が無いことは否定ではない。")
    if any(found.values()):
        lines[-1] = "判定: リリースノートに主張の語句がある。費用の実測ではない。"
        for raw in text.splitlines():
            if any(phrase in raw for phrase in PHRASES):
                lines.append("一致行: " + raw.strip()[:240])
    return lines


def fetch_changelog(url):
    request = urllib.request.Request(url, headers={"User-Agent": "ai-tryouts-check"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read().decode("utf-8", errors="replace")


def npm_version(spec):
    completed = subprocess.run(
        ["npm", "view", spec, "version"],
        capture_output=True,
        text=True,
        timeout=40,
        check=False,
    )
    versions = [
        line.strip()
        for line in completed.stdout.splitlines()
        if line.strip() and not line.startswith("npm ")
    ]
    if completed.returncode != 0 or not versions:
        return f"npm {spec}: 取得失敗 exit {completed.returncode}"
    return f"npm {spec}: {versions[-1]}"


def secret_name_count():
    count = 0
    for name in os.environ:
        upper = name.upper()
        if "ANTHROPIC" in upper or "CLAUDE" in upper:
            count += 1
    return count


def claude_local():
    path = shutil.which("claude")
    if path is None:
        return ["claude_cli: なし"]
    version = subprocess.run(
        [path, "--version"],
        capture_output=True,
        text=True,
        timeout=20,
        check=False,
    )
    version_line = (version.stdout or version.stderr).strip().splitlines()
    shown = version_line[0][:120] if version_line else f"exit {version.returncode}"
    auth = subprocess.run(
        [path, "auth", "status"],
        capture_output=True,
        text=True,
        timeout=20,
        check=False,
    )
    logged_in = "不明"
    method = "不明"
    try:
        payload = json.loads(auth.stdout)
    except json.JSONDecodeError:
        payload = None
    if isinstance(payload, dict):
        logged_in = payload.get("loggedIn", "不明")
        method = payload.get("authMethod", "不明")
    elif "Not logged in" in auth.stdout or "Not logged in" in auth.stderr:
        logged_in = False
        method = "none"
    return [
        f"claude_cli: {shown}",
        f"loggedIn: {logged_in}",
        f"authMethod: {method}",
    ]


def self_test():
    absent = report_lines("## 2.1.316\n- Added a setting\n", "fixture-absent")
    present = report_lines(
        "Now Haiku 5.5 writes it from short notes instead, so each update costs about 99% less.\n",
        "fixture-present",
    )
    absent_text = "\n".join(absent)
    present_text = "\n".join(present)
    problems = []
    if "phrase 99%: 無い" not in absent_text:
        problems.append("欠ける changelog を、99% ありと読んだ")
    if "未確認" not in absent_text:
        problems.append("欠ける changelog の判定に未確認が無い")
    if "否定ではない" not in absent_text:
        problems.append("欠ける changelog を否定と読める")
    if "phrase 99%: ある" not in present_text:
        problems.append("ある changelog を、99% 無しと読んだ")
    if "phrase short notes: ある" not in present_text:
        problems.append("short notes を見落とした")
    if "phrase Haiku 5.5 writes: ある" not in present_text:
        problems.append("Haiku 5.5 writes を見落とした")
    if "費用の実測ではない" not in present_text:
        problems.append("語句の一致を実測と読める")
    if problems:
        print("自己テスト: 失敗")
        for problem in problems:
            print(problem)
        return 1
    print("自己テスト: 通過")
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="公開リリースノートの語句と、ローカルで課金せずに見られる事実だけを出す。"
    )
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--changelog-file")
    parser.add_argument("--skip-npm", action="store_true")
    parser.add_argument("--skip-local", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()

    now = datetime.now(JST).strftime("%Y-%m-%d %H:%M JST")
    print(f"確認時刻: {now}")
    if args.changelog_file:
        with open(args.changelog_file, encoding="utf-8") as handle:
            text = handle.read()
        source = args.changelog_file
    else:
        text = fetch_changelog(CHANGELOG_URL)
        source = CHANGELOG_URL
    for line in report_lines(text, source):
        print(line)
    if not args.skip_npm:
        print(npm_version("@anthropic-ai/claude-code@2.1.316"))
        print(npm_version("@anthropic-ai/claude-code"))
    if not args.skip_local:
        for line in claude_local():
            print(line)
        print(
            "環境変数名の一致 ANTHROPIC または CLAUDE: "
            f"{secret_name_count()} 件。値は出していない。"
        )
    print("費用の実測: していない。モデル API は呼んでいない。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
