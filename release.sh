#!/usr/bin/env bash
set -e
FOLDER="accessmate-lite"

# 1. bump
ver=$(jq -r '.version' "$FOLDER/manifest.json")
IFS='.' read -r major minor patch <<<"$ver"
new="$major.$minor.$((patch+1))"
jq ".version=\"$new\"" "$FOLDER/manifest.json" > tmp && mv tmp "$FOLDER/manifest.json"
echo "Version bumped to $new"

# 2. commit & tag
git add "$FOLDER/manifest.json"
git commit -m "chore: bump version to v$new"
git tag -a "v$new" -m "Release v$new"
git push origin main --follow-tags

# 3. zip
zipName="accessmate-lite-v$new.zip"
rm -f "$zipName"
(cd "$FOLDER" && zip -r "../$zipName" .)
echo "Created $zipName"

# 4. GitHub release
gh release create "v$new" "$zipName" --title "v$new" --notes "Auto-release"
echo "Release v$new published!"
