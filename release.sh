#!/usr/bin/env bash
set -e

# 1. Commit uncommitted changes in development
echo "🟡 Committing any uncommitted changes in development..."
git checkout development
git add .
git commit -m "commit development" || true
git push origin development

# 2. Merge development into main
echo "🟡 Merging development into main..."
git checkout main
git pull origin main
git merge development --no-edit
git add .
git commit -m "Merge development into main" || true
git push origin main

# 3. Bump the version
echo "🟡 Bumping version in manifest.json..."
node bump-version.js

# 4. Commit and push version bump
git add manifest.json
git commit -m "chore: bump version for release" || true
git push origin main

# 5. Get new version string and zip the extension
ver=$(node -pe "require('./manifest.json').version")
zipname="accessmate-lite-v$ver.zip"
echo "🟢 Releasing version $ver"

rm -f "$zipname"
# Exclude .git and previous release zips and this script itself
zip -r "$zipname" . -x ".git/*" "*.zip" "release.sh" "bump-version.js"

# 6. Create GitHub Release and upload ZIP (requires gh CLI)
gh release create "v$ver" "$zipname" --title "v$ver" --notes "Automatic release of version $ver"

echo "✅ Release v$ver published and zip uploaded!"
