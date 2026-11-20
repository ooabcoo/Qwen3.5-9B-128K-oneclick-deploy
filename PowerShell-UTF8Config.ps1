# PowerShell UTF-8 编码配置文件
# 确保 PowerShell 能正确显示中文字符

# 设置控制台编码为 UTF-8
$OutputEncoding = New-Object System.Text.UTF8Encoding $false
[Console]::OutputEncoding = $OutputEncoding
$DefaultEncoding = [Console]::OutputEncoding

Write-Host "PowerShell 编码已设置为 UTF-8" -ForegroundColor Green
Write-Host "现在可以正常显示中文字符" -ForegroundColor Green
