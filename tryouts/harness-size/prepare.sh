#!/bin/sh
set -eu
dest=$1
kind=$2
root=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
rm -rf "$dest"
mkdir -p "$dest"
cp -a "$root/task/." "$dest/"
if [ "$kind" = "minimal" ]; then
  cp "$root/instructions/minimal.md" "$dest/AGENTS.md"
elif [ "$kind" = "full" ]; then
  cp "$root/instructions/full.md" "$dest/AGENTS.md"
elif [ "$kind" = "none" ]; then
  :
else
  echo "kind must be minimal, full, or none" >&2
  exit 2
fi
