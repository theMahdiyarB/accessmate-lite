# Requires: Node.js, gh CLI, PowerShell 5+, zip in PATH

# 1. Checkout and update main, merge development
git checkout main
git pull origin main
git merge development --no-edit
git add .
git commit -m "Merge development into main"  # does nothing if no new changes
git push origin main

# 2. Bump the version (node bump-version.js)
node bump-version.js

# 3. Commit and push version bump
git add accessmate-lite/manifest.json
git commit -m "chore: bump version for release"
git push origin main

# 4. Get new version string
$manifest = Get-Content .\accessmate-lite\manifest.json | ConvertFrom-Json
$ver = $manifest.version
$zipname = "accessmate-lite-v$ver.zip"

# 5. Zip the extension folder
if (Test-Path $zipname) { Remove-Item $zipname }
Compress-Archive -Path .\accessmate-lite\* -DestinationPath $zipname

# 6. Create GitHub Release and upload ZIP (requires gh CLI, user must be logged in)
gh release create "v$ver" $zipname --title "v$ver" --notes "Automatic release of version $ver"

Write-Host "✅ Release v$ver published and zip uploaded!"
