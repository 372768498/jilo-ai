param([string]$PythonExecutable = $env:JILO_PYTHON, [switch]$CheckOnly, [switch]$RepairCloud)
$ErrorActionPreference = "Stop"
$Repo = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Repo
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$LogDir = Join-Path $Repo "logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Log = Join-Path $LogDir ("autonomous-growth-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")
$Results = New-Object System.Collections.Generic.List[object]
$StartedAt = Get-Date

function Write-Log([string]$Message) {
  Add-Content -LiteralPath $Log -Value $Message -Encoding UTF8
  Write-Host $Message
}
function Import-DotEnv([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { return }
  Get-Content -LiteralPath $Path -Encoding UTF8 | ForEach-Object {
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
function Send-Feishu([string]$Title, [string]$Content) {
  $webhook = [Environment]::GetEnvironmentVariable("FEISHU_WEBHOOK_URL", "Process")
  if (-not $webhook) {
    Write-Log "[Feishu] FEISHU_WEBHOOK_URL not configured; notification unavailable"
    return
  }
  $payload = @{
    msg_type = "interactive"
    card = @{
      header = @{ title = @{ tag = "plain_text"; content = $Title }; template = "yellow" }
      elements = @(@{ tag = "markdown"; content = $Content })
    }
  } | ConvertTo-Json -Depth 10
  try {
    $response = Invoke-RestMethod -Uri $webhook -Method Post -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($payload)) -TimeoutSec 10
    if ($null -eq $response.code -or $response.code -ne 0) { throw "Feishu response rejected" }
  } catch {
    Write-Log "[Feishu] Notification failed"
  }
}
function Run-Step([string]$Name, [string[]]$Arguments) {
  Write-Log ([Environment]::NewLine + "===== " + $Name + " =====")
  Write-Log (Get-Date -Format o)
  $stepStartedAt = Get-Date
  $code = 1
  try {
    # 直接启动解释器，避免中间 PowerShell 吞掉 Python 的非零退出码。
    $global:LASTEXITCODE = $null
    $ErrorActionPreference = "Continue"
    & $PythonExecutable @Arguments 2>&1 | ForEach-Object { Write-Log ([string]$_) }
    $code = $global:LASTEXITCODE
    if ($null -eq $code) { $code = 1 }
  } catch {
    Write-Log ("Process start failed: " + $_.Exception.GetType().Name)
    $code = 1
  } finally {
    $ErrorActionPreference = "Stop"
  }
  $duration = [int]((Get-Date) - $stepStartedAt).TotalSeconds
  $Results.Add([pscustomobject]@{ Name = $Name; ExitCode = $code; DurationSeconds = $duration }) | Out-Null
  Write-Log "ExitCode: $code"
  Write-Log "DurationSeconds: $duration"
}
Import-DotEnv (Join-Path $Repo ".env.local")
Import-DotEnv (Join-Path $Repo ".env")
if (-not $PythonExecutable) { $PythonExecutable = $env:JILO_PYTHON }
if (-not $PythonExecutable) { $PythonExecutable = Join-Path $Repo ".venv-crawler\Scripts\python.exe" }
if (-not (Test-Path -LiteralPath $PythonExecutable -PathType Leaf)) {
  Write-Log "Python environment missing. Create .venv-crawler with Python 3.11 and install crawler/requirements.txt, or set JILO_PYTHON."
  exit 1
}
Run-Step "运行环境预检" @("-c", "import sys, feedparser, httpx, supabase, openai; assert sys.version_info[:2] == (3,11), 'Use Python 3.11'; print('Python', sys.version.split()[0], 'feedparser', feedparser.__version__)")
if ($Results[0].ExitCode -ne 0) { exit 1 }
if ($CheckOnly) { exit 0 }
$watchdogArguments = @("crawler/cloud_watchdog.py")
if ($RepairCloud) { $watchdogArguments += "--repair" }
Run-Step "云端定时任务监督" $watchdogArguments
Run-Step "新闻抓取" @("crawler/rss_news_crawler.py")
Run-Step "工具发现" @("crawler/tool_discovery.py")
Run-Step "热点探测" @("crawler/trend_agent.py")
Run-Step "数据采集" @("crawler/analytics_collector.py")
Run-Step "策略引擎" @("crawler/strategy_engine.py")
Run-Step "PV 增长控制器" @("crawler/traffic_growth_agent.py")
$env:SEO_ACTIONS_PER_RUN = "16"
Run-Step "SEO/AEO 内容生成" @("crawler/seo_article_generator.py")
$env:COMPARE_ACTIONS_PER_RUN = "5"
Run-Step "对比文章生成" @("crawler/compare_article_generator.py")
Run-Step "IndexNow 提交" @("crawler/indexnow_submitter.py")
Run-Step "页面表现回看" @("crawler/lookback_agent.py")
Run-Step "变现/系统监控" @("crawler/monitor_agent.py")
Run-Step "自修复/自迭代" @("crawler/self_iteration_agent.py")
Run-Step "自驱动总控" @("crawler/autonomy_guardian_agent.py")
$failed = @($Results | Where-Object { $_.ExitCode -ne 0 })
$summary = ($Results | ForEach-Object { "- $($_.Name): ExitCode=$($_.ExitCode), $($_.DurationSeconds)s" }) -join [Environment]::NewLine
Write-Log ("Completed: failures=" + $failed.Count + ", elapsed=" + [int]((Get-Date) - $StartedAt).TotalSeconds + "s")
# 例行成功静默，故障才提醒；任务计划程序读取真实退出码。
if ($failed.Count -gt 0) {
  Send-Feishu "jilo.ai 自动增长循环失败" $summary
  exit 1
}
exit 0
