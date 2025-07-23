<#
Bump manifest.json patch, tag, push, zip, create GitHub Release
Usage:  .\release.ps1
#>

$Folder = "accessmate-lite"


# 0. Pre-flight checks ------------------------------
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "GitHub CLI (gh) is not installed. Aborting."; exit 1
}

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Error "Working directory is not clean. Please commit or stash changes before releasing."; exit 1
}

$branch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $branch"

# 1. Read & bump version ----------------------------
try {
    $manifestPath = "$Folder\manifest.json"
    $json = Get-Content $manifestPath -Raw | ConvertFrom-Json
    $ver  = [version]$json.version
    $new  = "{0}.{1}.{2}" -f $ver.Major, $ver.Minor, ($ver.Build + 1)
    $json.version = $new
    $json | ConvertTo-Json -Depth 10 | Set-Content $manifestPath -Encoding UTF8
    Write-Host "Version bumped to $new"
} catch {
    Write-Error "Failed to bump version: $_"; exit 1
}


# 2. Commit & tag -----------------------------------
try {
    git add $manifestPath
    git commit -m "chore: bump version to v$new"
    git tag -a "v$new" -m "Release v$new"
    git push origin $branch --follow-tags
    Write-Host "Committed, tagged, and pushed to $branch."
} catch {
    Write-Error "Git commit/tag/push failed: $_"; exit 1
}


# 3. Zip folder -------------------------------------
$zipName = "accessmate-lite-v$new.zip"
try {
    if (Test-Path $zipName) { Remove-Item $zipName }
    Compress-Archive -Path "$Folder\*" -DestinationPath $zipName
    Write-Host "Created $zipName"
} catch {
    Write-Error "Failed to create zip: $_"; exit 1
}


# 4. Create GitHub Release --------------------------
try {
    gh release create "v$new" $zipName --title "v$new" --notes "Auto-release"
    Write-Host "Release v$new published!"
} catch {
    Write-Error "Failed to create GitHub release: $_"; exit 1
}

# 5. Summary ----------------------------------------
Write-Host "\n--- Release Summary ---"
Write-Host "Version: $new"
Write-Host "Branch:  $branch"
Write-Host "Zip:     $zipName"
Write-Host "Tag:     v$new"
Write-Host "Release: https://github.com/<your-username>/accessmate-lite/releases/tag/v$new"
