<#
Bump manifest.json patch, tag, push, zip, create GitHub Release
Usage:  .\release.ps1
#>

$Folder = "accessmate-lite"

# 1. Read & bump version ----------------------------
$manifestPath = "$Folder\manifest.json"
$json = Get-Content $manifestPath -Raw | ConvertFrom-Json
$ver  = [version]$json.version
$new  = "{0}.{1}.{2}" -f $ver.Major, $ver.Minor, ($ver.Build + 1)
$json.version = $new
$json | ConvertTo-Json -Depth 10 | Set-Content $manifestPath -Encoding UTF8
Write-Host "Version bumped to $new"

# 2. Commit & tag -----------------------------------
git add $manifestPath
git commit -m "chore: bump version to v$new"
git tag -a "v$new" -m "Release v$new"
git push origin main --follow-tags

# 3. Zip folder -------------------------------------
$zipName = "accessmate-lite-v$new.zip"
if (Test-Path $zipName) { Remove-Item $zipName }
Compress-Archive -Path "$Folder\*" -DestinationPath $zipName
Write-Host "Created $zipName"

# 4. Create GitHub Release --------------------------
gh release create "v$new" $zipName --title "v$new" --notes "Auto-release"
Write-Host "Release v$new published!"
