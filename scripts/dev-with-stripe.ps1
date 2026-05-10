$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$stripeCommand = Get-Command stripe -ErrorAction SilentlyContinue

if (-not $stripeCommand) {
  Write-Host "Stripe CLI no esta instalado o no esta en el PATH." -ForegroundColor Red
  Write-Host "Instalalo/inicia sesion y vuelve a ejecutar: npm run dev:stripe"
  exit 1
}

$state = [hashtable]::Synchronized(@{
  Secret = $null
})
$ready = New-Object System.Threading.ManualResetEventSlim($false)

$stripeInfo = New-Object System.Diagnostics.ProcessStartInfo
$stripeInfo.FileName = $stripeCommand.Source
$stripeInfo.Arguments = "listen --forward-to localhost:3000/api/stripe/webhook"
$stripeInfo.RedirectStandardOutput = $true
$stripeInfo.RedirectStandardError = $true
$stripeInfo.UseShellExecute = $false
$stripeInfo.CreateNoWindow = $true

$stripeProcess = New-Object System.Diagnostics.Process
$stripeProcess.StartInfo = $stripeInfo
$stripeProcess.EnableRaisingEvents = $true

$messageData = @{
  State = $state
  Ready = $ready
}

$outputEvent = Register-ObjectEvent -InputObject $stripeProcess -EventName OutputDataReceived -MessageData $messageData -Action {
  $line = $EventArgs.Data
  if (-not $line) {
    return
  }

  Write-Host "[stripe] $line"

  if (-not $Event.MessageData.State.Secret -and $line -match "(whsec_[A-Za-z0-9_]+)") {
    $Event.MessageData.State.Secret = $Matches[1]
    $Event.MessageData.Ready.Set() | Out-Null
  }
}

$errorEvent = Register-ObjectEvent -InputObject $stripeProcess -EventName ErrorDataReceived -MessageData $messageData -Action {
  $line = $EventArgs.Data
  if (-not $line) {
    return
  }

  Write-Host "[stripe] $line"

  if (-not $Event.MessageData.State.Secret -and $line -match "(whsec_[A-Za-z0-9_]+)") {
    $Event.MessageData.State.Secret = $Matches[1]
    $Event.MessageData.Ready.Set() | Out-Null
  }
}

try {
  Write-Host "Arrancando Stripe webhook listener..."
  $stripeProcess.Start() | Out-Null
  $stripeProcess.BeginOutputReadLine()
  $stripeProcess.BeginErrorReadLine()

  if (-not $ready.Wait([TimeSpan]::FromSeconds(20))) {
    throw "No se pudo detectar STRIPE_WEBHOOK_SECRET desde stripe listen."
  }

  $env:STRIPE_WEBHOOK_SECRET = $state.Secret
  Write-Host "Webhook local listo. Arrancando Next dev..." -ForegroundColor Green

  & npm.cmd run dev
}
finally {
  if ($stripeProcess -and -not $stripeProcess.HasExited) {
    $stripeProcess.Kill()
    $stripeProcess.WaitForExit()
  }

  Unregister-Event -SubscriptionId $outputEvent.Id -ErrorAction SilentlyContinue
  Unregister-Event -SubscriptionId $errorEvent.Id -ErrorAction SilentlyContinue
}
