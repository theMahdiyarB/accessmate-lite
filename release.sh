#!/usr/bin/env bash
set -e

# 1. Stage, commit, and push all changes on development branch
echo "🟡 Committing any uncommitted changes in development..."
git checkout development
git add .
git commit -m "commit development" || true   # '|| true' skips if nothing to commit
git push origin development

# 2. Checkout main, update, merge development, push
echo "🟡 Merging development into main..."
git checkout main
git pull origin main
git merge development --no-edit
git add .
git commit -m "Merge development into main" || true   # skip if nothing to commit
git push origin main

# 3. Bump the version in manifest.json (using bump-version.js)
echo "🟡 Bumping version in manifest.json..."
node bump-version.js

# 4. Commit and push version bump
git add accessmate-lite/manifest.json
git commit -m "chore: bump version for release"
git push origin main

# 5. Get new version string from manifest.json (using Node, no jq required)
ver=$(node -pe "require('./accessmate-lite/manifest.json').version")
zipname="accessmate-lite-v$ver.zip"
echo "🟢 Releasing version $ver"

# 6. Zip the extension folder
rm -f "$zipname"
(cd accessmate-lite && zip -r "../$zipname" .)
echo "🟢 Zipped as $zipname"

# 7. Check for existing GitHub release to avoid duplicates
if gh release view "v$ver" > /dev/null 2>&1; then
  echo "⚠️  Release v$ver already exists. Aborting to prevent duplicate release."
  exit 1
fi

# 8. Create GitHub Release and upload ZIP (requires gh CLI)
gh release create "v$ver" "$zipname" --title "v$ver" --notes "Automatic release of version $ver"
echo "✅ Release v$ver published and zip uploaded!"
