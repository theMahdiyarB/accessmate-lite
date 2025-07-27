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
zip "$zipname" manifest.json popup.html popup.js settings.html settings.js icon128.png

# 6. Extract latest changelog entry for this version
if [ -f CHANGELOG.md ]; then
  release_notes=$(awk "/^## v$ver[[:space:]]/{flag=1;next}/^## v/{flag=0}flag" CHANGELOG.md | sed '/^\s*$/d')
  if [ -z "$release_notes" ]; then
    release_notes="Automatic release of version $ver

See the full [CHANGELOG.md](https://github.com/theMahdiyarB/accessmate-lite/blob/main/CHANGELOG.md)"
  fi
else
  release_notes="Automatic release of version $ver

See the full [CHANGELOG.md](https://github.com/theMahdiyarB/accessmate-lite/blob/main/CHANGELOG.md)"
fi

# 7. Create GitHub Release and upload ZIP (requires gh CLI)
gh release create "v$ver" "$zipname" --title "v$ver" --notes "$release_notes"

echo "✅ Release v$ver published and zip uploaded!"

echo "🔄 Switching back to development branch..."
git checkout development
