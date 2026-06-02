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

Run-Step "RSS news crawler" "python crawler/rss_news_crawler.py"
Run-Step "Tool discovery" "python crawler/tool_discovery.py"
Run-Step "Trend agent" "python crawler/trend_agent.py"
Run-Step "Analytics collector" "python crawler/analytics_collector.py"
Run-Step "Strategy engine" "python crawler/strategy_engine.py"
Run-Step "Traffic growth agent" "python crawler/traffic_growth_agent.py"
Run-Step "SEO/AEO generator" "`$env:SEO_ACTIONS_PER_RUN='8'; python crawler/seo_article_generator.py"
Run-Step "Compare generator" "`$env:COMPARE_ACTIONS_PER_RUN='5'; python crawler/compare_article_generator.py"
Run-Step "IndexNow submitter" "python crawler/indexnow_submitter.py"
Run-Step "Lookback agent" "python crawler/lookback_agent.py"
Run-Step "Monitor agent" "python crawler/monitor_agent.py"
Run-Step "Self-iteration agent" "python crawler/self_iteration_agent.py"

Add-Content -Path $Log -Value ""
Add-Content -Path $Log -Value "Completed autonomous growth loop at $(Get-Date -Format o)"

$failed = @($Results | Where-Object { $_.ExitCode -ne 0 })
$summary = ($Results | ForEach-Object {
  if ($_.ExitCode -eq 0) { "- OK: $($_.Name)" } else { "- FAIL($($_.ExitCode)): $($_.Name)" }
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
