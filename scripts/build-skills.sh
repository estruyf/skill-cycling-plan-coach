#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_NAME="$(node -p "require('$ROOT_DIR/package.json').name")"
VERSION="$(node -p "require('$ROOT_DIR/package.json').version")"
OUTPUT_FILE="$ROOT_DIR/$SKILL_NAME.skill"

# Files and directories to include in the skill bundle
BUNDLE=(SKILL.md references LICENSE README.md)

for item in "${BUNDLE[@]}"; do
  if [[ ! -e "$ROOT_DIR/$item" ]]; then
    echo "Missing required file: $item" >&2
    exit 1
  fi
done

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

mkdir -p "$STAGE/$SKILL_NAME"
for item in "${BUNDLE[@]}"; do
  cp -r "$ROOT_DIR/$item" "$STAGE/$SKILL_NAME/"
done

# Stamp the version from package.json into the staged SKILL.md frontmatter
perl -i -pe "s/^  version: \"[^\"]*\"/  version: \"$VERSION\"/" "$STAGE/$SKILL_NAME/SKILL.md"

rm -f "$OUTPUT_FILE"
(
  cd "$STAGE"
  zip -rq "$OUTPUT_FILE" "$SKILL_NAME" -x '*/.DS_Store' '*/Thumbs.db'
)

echo "Created $OUTPUT_FILE (v$VERSION)"
