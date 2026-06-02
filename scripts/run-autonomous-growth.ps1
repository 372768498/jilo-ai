$ErrorActionPreference = "Continue"

$Repo = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Repo

$env:PYTHONIOENCODING = "utf-8"
$LogDir = Join-Path $Repo "logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Log = Join-Path $LogDir "autonomous-growth-$Stamp.log"

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
  } catch {
    Add-Content -Path $Log -Value "FAILED: $($_.Exception.Message)"
  }
}

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
