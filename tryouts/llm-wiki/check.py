#!/usr/bin/env python3

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SKILL_REL = Path(".agents/skills/llm-wiki/SKILL.md")
SKILL_LINKS = (
    ROOT / ".agents/skills/llm-wiki/SKILL.md",
    ROOT / ".claude/skills/llm-wiki/SKILL.md",
    ROOT / ".cursor/skills/llm-wiki/SKILL.md",
)
POINTERS = (
    ROOT / "AGENTS.md",
    ROOT / "CLAUDE.md",
    ROOT / ".cursor/rules/llm-wiki.mdc",
)
MARKER_LOGBOOK = "LOGBOOK: wiki/"
MARKER_PROCEDURE = "PROCEDURE: .agents/skills/llm-wiki/SKILL.md"
NUMBER = re.compile(r"\d{4}-\d{2}-\d{2}|\d+(?:\.\d+)?")
LINK = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


def fail(errors):
    print("FAIL")
    for error in errors:
        print(error)
    return 1


def walk_logbook(start):
    current = start.parent
    while True:
        if (current / "wiki/index.md").is_file() and (current / "AGENTS.md").is_file():
            return current
        if current.parent == current:
            return None
        current = current.parent


def article_paths():
    wiki = ROOT / "wiki"
    return sorted(
        path
        for path in wiki.rglob("*.md")
        if path.name not in {"index.md", "log.md"}
    )


def raw_text(article):
    raw_line = ""
    for line in article.read_text(encoding="utf-8").splitlines():
        if line.startswith("- Raw:"):
            raw_line = line
            break
    chunks = []
    for target in LINK.findall(raw_line):
        path = (article.parent / target).resolve()
        if not path.is_file():
            return None, f"{article.relative_to(ROOT)} raw missing: {target}"
        try:
            path.relative_to(ROOT / "raw")
        except ValueError:
            return None, f"{article.relative_to(ROOT)} raw escapes raw/: {target}"
        chunks.append(path.read_text(encoding="utf-8"))
    if not chunks:
        return None, f"{article.relative_to(ROOT)} has no Raw link"
    return "\n".join(chunks), None


def body_without_raw_line(article):
    lines = []
    for line in article.read_text(encoding="utf-8").splitlines():
        if line.startswith("- Raw:") or line.startswith("- Updated:"):
            continue
        lines.append(line)
    return "\n".join(lines)


def search(term):
    hits = []
    for path in article_paths():
        if term in path.read_text(encoding="utf-8"):
            hits.append(path.relative_to(ROOT).as_posix())
    return hits


def check():
    errors = []
    resolved = []
    for path in SKILL_LINKS:
        if not path.exists():
            errors.append(f"missing {path.relative_to(ROOT).as_posix()}")
            continue
        resolved.append(path.resolve())
        found = walk_logbook(path)
        if found != ROOT:
            errors.append(
                f"{path.relative_to(ROOT).as_posix()} walks to {found}, want {ROOT}"
            )
    if resolved and len(set(resolved)) != 1:
        joined = ", ".join(str(path) for path in resolved)
        errors.append(f"skill paths differ: {joined}")
    if len(resolved) == len(SKILL_LINKS):
        skill = resolved[0]
        if skill.parent.name != "llm-wiki":
            errors.append(f"skill directory is {skill.parent.name}")
        frontmatter = skill.read_text(encoding="utf-8").split("---", 2)
        if len(frontmatter) < 3 or "name: llm-wiki" not in frontmatter[1]:
            errors.append("frontmatter name is not llm-wiki")
        if skill.resolve() != (ROOT / SKILL_REL).resolve():
            errors.append("canonical skill is not .agents/skills/llm-wiki/SKILL.md")
    for path in POINTERS:
        text = path.read_text(encoding="utf-8")
        if MARKER_LOGBOOK not in text or MARKER_PROCEDURE not in text:
            errors.append(f"marker missing in {path.relative_to(ROOT).as_posix()}")

    articles = article_paths()
    index = (ROOT / "wiki/index.md").read_text(encoding="utf-8")
    log = (ROOT / "wiki/log.md").read_text(encoding="utf-8")
    indexed = set()
    for target in LINK.findall(index):
        path = (ROOT / "wiki" / target).resolve()
        if not path.is_file():
            errors.append(f"index link missing: {target}")
            continue
        indexed.add(path)
    for article in articles:
        if article.resolve() not in indexed:
            errors.append(f"article missing from index: {article.relative_to(ROOT).as_posix()}")
        source, error = raw_text(article)
        if error:
            errors.append(error)
            continue
        for token in NUMBER.findall(body_without_raw_line(article)):
            if token not in source:
                errors.append(
                    f"{article.relative_to(ROOT).as_posix()} has {token} outside raw"
                )
        for target in LINK.findall(article.read_text(encoding="utf-8")):
            if target.startswith("../"):
                continue
            if not (article.parent / target).is_file():
                errors.append(
                    f"{article.relative_to(ROOT).as_posix()} link missing: {target}"
                )
    for raw in sorted((ROOT / "raw").rglob("*.md")):
        rel = raw.relative_to(ROOT).as_posix()
        if rel not in log:
            errors.append(f"log omits {rel}")

    expected = {
        "200 円": ["wiki/paper-plane/meeting.md"],
        "11.4": ["wiki/paper-plane/distance.md"],
        "存在しない語彙zzz": [],
    }
    for term, want in expected.items():
        got = search(term)
        if got != want:
            errors.append(f"query {term!r} -> {got}, want {want}")
    return errors


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "query":
        if len(sys.argv) != 3:
            print("usage: python3 check.py query <term>")
            return 2
        hits = search(sys.argv[2])
        print(f"query: {sys.argv[2]}")
        if not hits:
            print("hits: none")
            return 0
        for hit in hits:
            print(f"hit: {hit}")
        return 0
    errors = check()
    if errors:
        return fail(errors)
    skill = (ROOT / SKILL_REL).resolve()
    print("OK")
    print(f"skill: {skill}")
    print(f"same_file_entries: {len(SKILL_LINKS)}")
    print(f"articles: {len(article_paths())}")
    for term in ("200 円", "11.4"):
        print(f"query {term}: {', '.join(search(term))}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
