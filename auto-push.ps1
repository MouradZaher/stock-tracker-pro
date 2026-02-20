# Auto-commit and push script for stock-tracker-pro
# Runs silently - only commits if there are actual changes

Set-Location "D:\Fund Issuer\anti-proj"

# Check if there are any changes to commit
$status = git status --porcelain
if ($status) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    git add .
    git commit -m "Auto-save: $timestamp"
    git push origin main
}
