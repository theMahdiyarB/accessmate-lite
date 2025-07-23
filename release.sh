#!/usr/bin/env bash
set -e
FOLDER="accessmate-lite"

# 0. Pre-flight checks
if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is not installed." >&2; exit 1
fi

if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Working directory is not clean. Please commit or stash changes before releasing." >&2; exit 1
fi

branch=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $branch"

# 1. bump
manifest="$FOLDER/manifest.json"
ver=$(jq -r '.version' "$manifest")
IFS='.' read -r major minor patch <<<"$ver"
new="$major.$minor.$((patch+1))"
if ! jq ".version=\"$new\"" "$manifest" > tmp && mv tmp "$manifest"; then
  echo "Error: Failed to bump version." >&2; exit 1
fi
echo "Version bumped to $new"

# 2. commit & tag
set -o pipefail
if ! git add "$manifest" || ! git commit -m "chore: bump version to v$new" || ! git tag -a "v$new" -m "Release v$new" || ! git push origin "$branch" --follow-tags; then
  echo "Error: Git commit/tag/push failed." >&2; exit 1
fi
echo "Committed, tagged, and pushed to $branch."

# 3. zip
zipName="accessmate-lite-v$new.zip"
rm -f "$zipName"
if ! (cd "$FOLDER" && zip -r "../$zipName" .); then
  echo "Error: Failed to create zip archive." >&2; exit 1
fi
echo "Created $zipName"

# 4. GitHub release
if ! gh release create "v$new" "$zipName" --title "v$new" --notes "Auto-release"; then
  echo "Error: Failed to create GitHub release." >&2; exit 1
fi
echo "Release v$new published!"

# 5. Summary
echo -e "\n--- Release Summary ---"
echo "Version: $new"
echo "Branch:  $branch"
echo "Zip:     $zipName"
echo "Tag:     v$new"
echo "Release: https://github.com/<your-username>/accessmate-lite/releases/tag/v$new"
