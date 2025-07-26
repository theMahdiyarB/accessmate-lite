# Requires PowerShell 7+, git, node, zip (Info-ZIP or 7zip), and GitHub CLI ('gh')
$ErrorActionPreference = "Stop"

# 1. Commit uncommitted changes in development
Write-Host "🟡 Committing any uncommitted changes in development..."
git checkout development
git add .
try { git commit -m "commit development" } catch {}
git push origin development

# 2. Merge development into main
Write-Host "🟡 Merging development into main..."
git checkout main
git pull origin main
git merge development --no-edit
git add .
try { git commit -m "Merge development into main" } catch {}
git push origin main

# 3. Bump the version
Write-Host "🟡 Bumping version in manifest.json..."
node bump-version.js

# 4. Commit and push version bump
git add manifest.json
try { git commit -m "chore: bump version for release" } catch {}
git push origin main

# 5. Get new version string and zip the extension
$ver = node -pe "require('./manifest.json').version"
$zipname = "accessmate-lite-v$ver.zip"
Write-Host "🟢 Releasing version $ver"

if (Test-Path $zipname) { Remove-Item $zipname -Force }

# Exclude .git, previous zips, release/bump scripts
$excludeFiles = @("*.zip", "release.sh", "bump-version.js", "*.ps1")
$excludeDirs = @(".git")
$allFiles = Get-ChildItem -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring((Get-Location).Path.Length + 1)
    ($excludeFiles | ForEach-Object { $_ }) -notcontains $_.Name -and
    ($excludeDirs | ForEach-Object { $rel.StartsWith($_) }) -notcontains $true
}
Compress-Archive -Path $allFiles.FullName -DestinationPath $zipname

# 6. Extract latest changelog entry for this version
$changelogPath = "CHANGELOG.md"
if (Test-Path $changelogPath) {
    $lines = Get-Content $changelogPath
    $start = ($lines | Select-String "^## v$ver\s" | Select-Object -First 1).LineNumber
    if ($start) {
        $next = ($lines | Select-String "^## v" | Where-Object { $_.LineNumber -gt $start } | Select-Object -First 1).LineNumber
        $end = if ($next) { $next - 2 } else { $lines.Length }
        $release_notes = $lines[($start)..$end] -join "`n"
        $release_notes = $release_notes.Trim()
    } else {
        $release_notes = ""
    }
    if ([string]::IsNullOrWhiteSpace($release_notes)) {
        $release_notes = "Automatic release of version $ver`n`nSee the full [CHANGELOG.md](https://github.com/theMahdiyarB/accessmate-lite/blob/main/CHANGELOG.md)"
    }
} else {
    $release_notes = "Automatic release of version $ver`n`nSee the full [CHANGELOG.md](https://github.com/theMahdiyarB/accessmate-lite/blob/main/CHANGELOG.md)"
}

# 7. Create GitHub Release and upload ZIP (requires gh CLI)
gh release create "v$ver" "$zipname" --title "v$ver" --notes "$release_notes"

Write-Host "✅ Release v$ver published and zip uploaded!"

Write-Host "🔄 Switching back to development branch..."
git checkout development
