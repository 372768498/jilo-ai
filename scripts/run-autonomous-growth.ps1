$ErrorActionPreference = "Continue"

$Repo = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Repo

$env:PYTHONIOENCODING = "utf-8"
$LogDir = Join-Path $Repo "logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Log = Join-Path $LogDir "autonomous-growth-$Stamp.log"
$Results = New-Object System.Collections.Generic.List[object]

function Import-DotEnv {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return }
  Get-Content -LiteralPath $Path | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
      $name = $matches[1]
      $value = $matches[2].Trim()
      if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      if (-not [Environment]::GetEnvironmentVariable($name, "Process")) {
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
      }
    }
  }
}

function Send-Feishu {
  param(
    [string]$Title,
    [string]$Content,
    [string]$Color = "blue"
  )
  $webhook = [Environment]::GetEnvironmentVariable("FEISHU_WEBHOOK_URL", "Process")
  if (-not $webhook) {
    Add-Content -Path $Log -Value "[Feishu] FEISHU_WEBHOOK_URL not configured"
    return
  }
  $payload = @{
    msg_type = "interactive"
    card = @{
      header = @{
        title = @{ tag = "plain_text"; content = $Title }
        template = $Color
      }
      elements = @(
        @{ tag = "markdown"; content = $Content }
      )
    }
  } | ConvertTo-Json -Depth 10
  try {
    Invoke-RestMethod -Uri $webhook -Method Post -ContentType "application/json" -Body $payload -TimeoutSec 10 | Out-Null
  } catch {
    Add-Content -Path $Log -Value "[Feishu] Send failed: $($_.Exception.Message)"
  }
}

function Run-Step {
  param(
    [string]$Name,
    [string]$Command
  )
  Add-Content -Path $Log -Value ""
  Add-Content -Path $Log -Value "===== $Name ====="
  Add-Content -Path $Log -Value "$(Get-Date -Format o)"
  try {
    powershell -NoProfile -ExecutionPolicy Bypass -Command $Command 2>&1 |
      Tee-Object -FilePath $Log -Append
    $code = $LASTEXITCODE
    if ($null -eq $code) { $code = 0 }
    $Results.Add([pscustomobject]@{ Name = $Name; ExitCode = $code }) | Out-Null
    Add-Content -Path $Log -Value "ExitCode: $code"
  } catch {
    Add-Content -Path $Log -Value "FAILED: $($_.Exception.Message)"
    $Results.Add([pscustomobject]@{ Name = $Name; ExitCode = 999 }) | Out-Null
  }
}

Import-DotEnv (Join-Path $Repo ".env.local")
Import-DotEnv (Join-Path $Repo ".env")

Send-Feishu `
  -Title "jilo.ai 自动增长循环启动" `
  -Content "**时间：** $(Get-Date -Format o)`n`n**仓库：** $Repo`n`n**日志：** $Log" `
  -Color "blue"

Run-Step "新闻抓取" "python crawler/rss_news_crawler.py"
Run-Step "工具发现" "python crawler/tool_discovery.py"
Run-Step "热点探测" "python crawler/trend_agent.py"
Run-Step "数据采集" "python crawler/analytics_collector.py"
Run-Step "策略引擎" "python crawler/strategy_engine.py"
Run-Step "PV 增长控制器" "python crawler/traffic_growth_agent.py"
Run-Step "SEO/AEO 内容生成" "`$env:SEO_ACTIONS_PER_RUN='8'; python crawler/seo_article_generator.py"
Run-Step "对比文章生成" "`$env:COMPARE_ACTIONS_PER_RUN='5'; python crawler/compare_article_generator.py"
Run-Step "IndexNow 提交" "python crawler/indexnow_submitter.py"
Run-Step "页面表现回看" "python crawler/lookback_agent.py"
Run-Step "变现/系统监控" "python crawler/monitor_agent.py"
Run-Step "自修复/自迭代" "python crawler/self_iteration_agent.py"

Add-Content -Path $Log -Value ""
Add-Content -Path $Log -Value "Completed autonomous growth loop at $(Get-Date -Format o)"

$failed = @($Results | Where-Object { $_.ExitCode -ne 0 })
$summary = ($Results | ForEach-Object {
  if ($_.ExitCode -eq 0) { "- 通过：$($_.Name)" } else { "- 失败（退出码 $($_.ExitCode)）：$($_.Name)" }
}) -join "`n"

if ($failed.Count -gt 0) {
  Send-Feishu `
    -Title "jilo.ai 自动增长循环完成：有失败" `
    -Content "**时间：** $(Get-Date -Format o)`n`n**失败步骤：** $($failed.Count)`n`n$summary`n`n**日志：** $Log" `
    -Color "yellow"
} else {
  Send-Feishu `
    -Title "jilo.ai 自动增长循环完成：全部通过" `
    -Content "**时间：** $(Get-Date -Format o)`n`n$summary`n`n**日志：** $Log" `
    -Color "green"
}
