# 在可访问 GitHub 的机器上运行（需已安装 gh 并完成 gh auth login）
# 用法: .\scripts\publish-github.ps1
# 可选: .\scripts\publish-github.ps1 -Name my-repo -Public

param(
  [string]$Name = "huaxi-command-center",
  [switch]$Public
)

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))
if (-not (Test-Path ".git")) { throw "未找到 .git，请先在项目根目录 git init" }

gh auth status | Out-Null

$visibility = if ($Public) { "--public" } else { "--private" }
Write-Host "Creating GitHub repo: $Name ($visibility) ..."
gh repo create $Name $visibility --source=. --remote=origin --description "华西县域急危重症指挥系统 · 演示前端" --push

$url = gh repo view --json url -q .url
Write-Host "Done: $url"
