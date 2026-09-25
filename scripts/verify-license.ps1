<#
.SYNOPSIS
  End to end check of the REGIX license SID/HWID verification endpoint.

.DESCRIPTION
  Exercises GET /api/verify across every documented status case, plus the
  in memory rate limit. Seeds its own RGX test key through the bun helper,
  then removes all test rows. Run from the repo root with the dev server up:
    powershell -File scripts/verify-license.ps1
    powershell -File scripts/verify-license.ps1 -BaseUrl http://localhost:3000

  Exit code is 0 when every check passes, 1 otherwise.
#>
param(
  [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Helper = Join-Path $RepoRoot "scripts/license-test-helper.ts"
$Key = "RGX-PS1-VERIFY-TEST"
$Device = "PS1-DEV-01"
$script:passed = 0
$script:failed = 0

function Invoke-Helper {
  param([string[]]$HelperArgs)
  Push-Location $RepoRoot
  $prevPreference = $ErrorActionPreference
  try {
    # Keep Continue here: native stderr lines must not throw before the
    # exit code check below runs.
    $ErrorActionPreference = "Continue"
    $out = & bun $Helper @HelperArgs 2>&1
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prevPreference
    if ($code -ne 0) { throw "helper failed ($code): $out" }
    $text = ($out | Where-Object { $_ -isnot [System.Management.Automation.ErrorRecord] } | Out-String)
    if ($null -eq $text) { return "" }
    return $text.Trim()
  }
  finally {
    $ErrorActionPreference = $prevPreference
    Pop-Location
  }
}

function Invoke-Verify {
  param(
    [string]$QueryKey = "",
    [string]$DeviceId = "",
    [hashtable]$ExtraHeaders = @{}
  )
  $url = "$BaseUrl/api/verify"
  $params = @()
  if ($QueryKey -ne "") { $params += "key=" + [uri]::EscapeDataString($QueryKey) }
  if ($DeviceId -ne "") { $params += "device=" + [uri]::EscapeDataString($DeviceId) }
  if ($params.Count -gt 0) { $url += "?" + ($params -join "&") }
  try {
    $body = Invoke-RestMethod -Uri $url -Headers $ExtraHeaders -TimeoutSec 15 -UseBasicParsing
    return @{ http = 200; body = $body }
  }
  catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 429) { return @{ http = 429; body = $null } }
    $raw = $_.ErrorDetails.Message
    $parsed = $null
    try { $parsed = $raw | ConvertFrom-Json } catch { $parsed = $null }
    return @{ http = $code; body = $parsed; raw = $raw }
  }
}

function Assert-Check {
  param(
    [string]$Name,
    [bool]$Condition,
    [string]$Detail = ""
  )
  if ($Condition) {
    $script:passed++
    Write-Host "PASS  $Name" -ForegroundColor Green
  }
  else {
    $script:failed++
    Write-Host "FAIL  $Name :: $Detail" -ForegroundColor Red
  }
}

try {
  # Health: app must answer before the matrix runs.
  try {
    Invoke-WebRequest -Uri "$BaseUrl/api/auth/ok" -TimeoutSec 10 -UseBasicParsing | Out-Null
  }
  catch {
    throw "app is not reachable at $BaseUrl (start it with: bun run dev --port 3000)"
  }

  Invoke-Helper @("setup", $Key, "REGIX", "lifetime") | Out-Null
  Write-Host "Test key seeded: $Key"

  # 1. Missing key.
  $r = Invoke-Verify
  Assert-Check "missing key returns inactive" `
    ($r.http -eq 200 -and $r.body.status -eq "inactive" -and $r.body.message -eq "Key required.") `
    ($r.body | ConvertTo-Json -Compress)

  # 2. Unknown key.
  $r = Invoke-Verify -QueryKey "RGX-NOPE-DOES-NOT-EXIST"
  Assert-Check "unknown key returns inactive" `
    ($r.http -eq 200 -and $r.body.status -eq "inactive" -and $r.body.message -eq "Invalid or banned key.") `
    ($r.body | ConvertTo-Json -Compress)

  # 3. Valid key, no device.
  $r = Invoke-Verify -QueryKey $Key
  Assert-Check "valid key returns active" `
    ($r.http -eq 200 -and $r.body.status -eq "active" -and $r.body.provider -eq "REGIX") `
    ($r.body | ConvertTo-Json -Compress)

  # 4. Valid key plus new device registers one activation.
  $r = Invoke-Verify -QueryKey $Key -DeviceId $Device
  $rows = (Invoke-Helper @("activations", $Key)) | ConvertFrom-Json
  $match = @($rows | Where-Object { $_.deviceId -eq $Device -and $_.active -eq $true })
  Assert-Check "first device check returns active" `
    ($r.http -eq 200 -and $r.body.status -eq "active") `
    ($r.body | ConvertTo-Json -Compress)
  Assert-Check "device activation row created once" `
    ($match.Count -eq 1 -and @($rows).Count -eq 1) `
    ($rows | ConvertTo-Json -Compress)

  # 5. Repeat check does not duplicate the row.
  $r = Invoke-Verify -QueryKey $Key -DeviceId $Device
  $rows = (Invoke-Helper @("activations", $Key)) | ConvertFrom-Json
  Assert-Check "repeat device check stays active without duplicates" `
    ($r.body.status -eq "active" -and @($rows).Count -eq 1) `
    ($rows | ConvertTo-Json -Compress)

  # 6. Revoked device.
  Invoke-Helper @("set-device", $Key, $Device, "0") | Out-Null
  $r = Invoke-Verify -QueryKey $Key -DeviceId $Device
  Assert-Check "revoked device returns inactive" `
    ($r.http -eq 200 -and $r.body.status -eq "inactive" -and $r.body.message -eq "Device revoked.") `
    ($r.body | ConvertTo-Json -Compress)

  # 7. Restored device.
  Invoke-Helper @("set-device", $Key, $Device, "1") | Out-Null
  $r = Invoke-Verify -QueryKey $Key -DeviceId $Device
  Assert-Check "restored device returns active" `
    ($r.http -eq 200 -and $r.body.status -eq "active") `
    ($r.body | ConvertTo-Json -Compress)

  # 8. Banned key.
  Invoke-Helper @("set-key-active", $Key, "0") | Out-Null
  $r = Invoke-Verify -QueryKey $Key -DeviceId $Device
  Assert-Check "banned key returns inactive" `
    ($r.http -eq 200 -and $r.body.status -eq "inactive" -and $r.body.message -eq "Invalid or banned key.") `
    ($r.body | ConvertTo-Json -Compress)
  Invoke-Helper @("set-key-active", $Key, "1") | Out-Null

  # 9. Expired license.
  $past = (Get-Date).AddDays(-1).ToString("o")
  Invoke-Helper @("set-expiry", $Key, $past) | Out-Null
  $r = Invoke-Verify -QueryKey $Key -DeviceId $Device
  Assert-Check "expired license returns inactive" `
    ($r.http -eq 200 -and $r.body.status -eq "inactive" -and $r.body.message -eq "License expired.") `
    ($r.body | ConvertTo-Json -Compress)
  Invoke-Helper @("set-expiry", $Key, "") | Out-Null
  $r = Invoke-Verify -QueryKey $Key -DeviceId $Device
  Assert-Check "unexpired key returns active again" `
    ($r.http -eq 200 -and $r.body.status -eq "active") `
    ($r.body | ConvertTo-Json -Compress)

  # 10. Rate limit: burst on an isolated fake client IP.
  $limited = 0
  for ($i = 0; $i -lt 70; $i++) {
    $probe = Invoke-Verify -QueryKey $Key -ExtraHeaders @{ "X-Forwarded-For" = "ps1-ratelimit-probe" }
    if ($probe.http -eq 429) { $limited++ }
  }
  Assert-Check "burst over 60 per minute gets 429s" `
    ($limited -ge 1) `
    ("429 count: $limited")
}
finally {
  Invoke-Helper @("cleanup", $Key) | Out-Null
  Write-Host "Test key removed."
}

Write-Host ""
Write-Host "Passed: $($script:passed)  Failed: $($script:failed)"
if ($script:failed -gt 0) { exit 1 }
Write-Host "All SID/HWID verification checks passed." -ForegroundColor Green
