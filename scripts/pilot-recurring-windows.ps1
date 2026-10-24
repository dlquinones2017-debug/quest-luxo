# This reviewed body is embedded in the current-user scheduled task via -EncodedCommand.
# Registration supplies $Root, $ExpectedFiles and $IncludeOutbox; no execution policy changes are required.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
$key=$null
try {
  $Root=[IO.Path]::GetFullPath($Root)
  $who=[Security.Principal.WindowsIdentity]::GetCurrent()
  $sid=$who.User.Value
  if(-not (Get-Acl -LiteralPath $Root).AreAccessRulesProtected){throw 'Inherited root'}
  $items=@(Get-Item -LiteralPath $Root)+@(Get-ChildItem -LiteralPath $Root -Force -Recurse)
  foreach($item in $items){
    if(($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'Reparse point'}
    $acl=Get-Acl -LiteralPath $item.FullName
    if($acl.Owner -ne $who.Name -or @($acl.Access).Count -eq 0){throw 'Unexpected owner'}
    foreach($rule in $acl.Access){if($rule.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -ne $sid -or $rule.AccessControlType -ne 'Allow'){throw 'Unexpected ACL'}}
  }
  $parent=[IO.DirectoryInfo]$Root
  while($null -ne $parent){if(($parent.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'Reparse ancestry'};$parent=$parent.Parent}
  # The client statically imports the outbox verifier even when that profile is disabled.
  if($ExpectedFiles.Count -ne 5){throw 'Verifier manifest required'}
  foreach($name in $ExpectedFiles.Keys){
    if($name -notmatch '^[a-z-]+\.mjs$'){throw 'Unexpected executable name'}
    if((Get-FileHash -LiteralPath (Join-Path $Root $name) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ExpectedFiles[$name]){throw 'Executable integrity mismatch'}
  }
  $key=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes((Join-Path $Root 'pipeline-key.dpapi')),[Text.Encoding]::UTF8.GetBytes('QuestLuxo.Pilot.Recovery.v1'),[Security.Cryptography.DataProtectionScope]::CurrentUser)
  if($key.Length -ne 32){throw 'Invalid key'}
  $start=New-Object Diagnostics.ProcessStartInfo
  $start.FileName=(Get-Command node.exe -ErrorAction Stop).Source
  $start.Arguments='"'+(Join-Path $Root 'pilot-recurring-backup-client.mjs')+'" "'+$Root+'"'
  if($IncludeOutbox){$start.Arguments+=' --include-outbox'}
  $start.UseShellExecute=$false
  $start.RedirectStandardInput=$true
  $start.RedirectStandardOutput=$true
  $start.RedirectStandardError=$true
  $child=New-Object Diagnostics.Process
  $child.StartInfo=$start
  try {
    if(-not $child.Start()){throw 'Child failed'}
    $child.StandardInput.Write(([BitConverter]::ToString($key)).Replace('-','').ToLowerInvariant())
    $child.StandardInput.Close()
    $output=$child.StandardOutput.ReadToEnd()
    $errors=$child.StandardError.ReadToEnd()
    $child.WaitForExit()
    if($child.ExitCode -ne 0){throw 'Backup held'}
    $report=$output|ConvertFrom-Json
    if($report.status -ne 'VERIFIED' -or $report.acknowledged -ne $true -or $report.businessDataReady -ne $false){throw 'Unexpected proof'}
    $report|ConvertTo-Json -Compress
  } finally {$child.Dispose()}
} catch {Write-Output 'WINDOWS_RECURRING_BACKUP_HELD';exit 1}
finally {if($null -ne $key){[Array]::Clear($key,0,$key.Length)}}
