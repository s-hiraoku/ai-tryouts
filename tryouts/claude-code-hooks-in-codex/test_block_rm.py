#!/usr/bin/env python3
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCRIPT = ROOT / "hooks" / "block_rm.py"
DENY = {
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": "rm -rf を含むコマンドは止めた",
    }
}


def run_case(stdin_path):
    payload = (ROOT / stdin_path).read_text(encoding="utf-8")
    return subprocess.run(
        [sys.executable, str(SCRIPT)],
        input=payload,
        text=True,
        capture_output=True,
        check=False,
    )


def check(name, proc, decision):
    errors = []
    if proc.returncode != 0:
        errors.append(f"exit {proc.returncode}")
    if proc.stderr != "":
        errors.append(f"stderr {proc.stderr!r}")
    if decision == "allow":
        if proc.stdout != "":
            errors.append(f"stdout {proc.stdout!r}")
    elif decision == "deny":
        try:
            got = json.loads(proc.stdout)
        except json.JSONDecodeError as exc:
            errors.append(f"stdout is not json ({exc})")
        else:
            if got != DENY:
                errors.append(f"stdout {got!r}")
        if proc.stdout != json.dumps(DENY, ensure_ascii=False) + "\n":
            errors.append("stdout is not the single deny object plus a newline")
    else:
        errors.append(f"unknown decision {decision!r}")
    if errors:
        return f"{name}: " + "; ".join(errors)
    print(f"pass {name} exit={proc.returncode} decision={decision}")
    return None


def main():
    cases = json.loads((ROOT / "fixtures" / "cases.json").read_text(encoding="utf-8"))
    failures = []
    for case in cases:
        proc = run_case(case["stdin"])
        failure = check(case["name"], proc, case["decision"])
        if failure:
            failures.append(failure)
    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1
    print(f"{len(cases)} cases passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
