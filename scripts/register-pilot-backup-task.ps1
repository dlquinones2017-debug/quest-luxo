# Run this reviewed registration body inline with $Root set to the approved private recovery tree.
# Optional $IncludeOutbox enables the fourth fixed fixture. Updating an owned task requires its observed action hash.
# No elevation, stored password or execution-policy change.
$ErrorActionPreference='Stop'
$taskName='QuestLuxo-Synthetic-Pilot-Backup'
$who=[Security.Principal.WindowsIdentity]::GetCurrent()
$existing=Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if($existing){
  if($ExpectedActionSHA256 -notmatch '^[a-f0-9]{64}$' -or $existing.Actions.Count -ne 1 -or $existing.Triggers.Count -ne 3 -or $existing.State -eq 'Running' -or $existing.Principal.LogonType -ne 'Interactive' -or $existing.Principal.RunLevel -ne 'Limited'){throw 'Existing task requires reviewed identity and action hash'}
  $owner=([Security.Principal.NTAccount]$existing.Principal.UserId).Translate([Security.Principal.SecurityIdentifier]).Value
  if($owner -ne $who.User.Value -or $existing.Actions[0].Execute -ne (Join-Path $PSHOME 'powershell.exe') -or @($existing.Triggers|Where-Object {$_.Repetition.Interval -eq 'PT6H'}).Count -ne 1 -or $existing.Settings.WakeToRun){throw 'Unexpected task configuration'}
  $sha=[Security.Cryptography.SHA256]::Create()
  try{$actualHash=([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($existing.Actions[0].Arguments)))).Replace('-','').ToLowerInvariant()}finally{$sha.Dispose()}
  if($actualHash -ne $ExpectedActionSHA256){throw 'Task action changed; preserve and review'}
}
$Root=[IO.Path]::GetFullPath($Root)
$files=@('pilot-backup-protocol.mjs','pilot-independent-recovery.mjs','crm-preparation-independent-recovery.mjs','pilot-recurring-backup-client.mjs','crm-outbox-independent-recovery.mjs')
$expected=@{}
foreach($name in $files){$expected[$name]=(Get-FileHash -LiteralPath (Join-Path $Root $name) -Algorithm SHA256).Hash.ToLowerInvariant()}
$literal='$Root='''+$Root.Replace("'","''")+''';$ExpectedFiles=@{'
foreach($name in $files){$literal+=''''+$name+'''='''+$expected[$name]+''';'}
$literal+='};$IncludeOutbox=$'+([bool]$IncludeOutbox).ToString().ToLowerInvariant()+';'+[Environment]::NewLine
$body=$literal+[IO.File]::ReadAllText((Join-Path $Root 'pilot-recurring-windows.ps1'))
$encoded=[Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($body))
$action=New-ScheduledTaskAction -Execute (Join-Path $PSHOME 'powershell.exe') -Argument ('-NoProfile -NonInteractive -EncodedCommand '+$encoded)
$principal=New-ScheduledTaskPrincipal -UserId $who.Name -LogonType Interactive -RunLevel Limited
$start=Get-Date
# Two unattended acceptance triggers are separated by 90 seconds; ongoing retention runs every six hours.
$first=New-ScheduledTaskTrigger -Once -At $start.AddSeconds(30)
$second=New-ScheduledTaskTrigger -Once -At $start.AddSeconds(120)
$ongoing=New-ScheduledTaskTrigger -Once -At $start.AddHours(6) -RepetitionInterval (New-TimeSpan -Hours 6)
$settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 3) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$task=New-ScheduledTask -Action $action -Trigger @($first,$second,$ongoing) -Principal $principal -Settings $settings -Description 'Authenticated encrypted synthetic pilot backups; DPAPI CurrentUser recovery; no business-data or paid-model execution.'
Register-ScheduledTask -TaskName $taskName -InputObject $task -Force:([bool]$existing) | Out-Null
$actual=Get-ScheduledTask -TaskName $taskName
if($actual.Principal.LogonType -ne 'Interactive' -or $actual.Principal.RunLevel -ne 'Limited' -or $actual.Actions.Count -ne 1 -or $actual.Triggers.Count -ne 3){throw 'Unexpected registered task'}
[pscustomobject]@{status='REGISTERED';taskName=$taskName;user=$who.Name;logonType=$actual.Principal.LogonType.ToString();runLevel=$actual.Principal.RunLevel.ToString();firstAutomaticRun=$first.StartBoundary;secondAutomaticRun=$second.StartBoundary;recurrence='PT6H';expectedStoreCount=3+[int]([bool]$IncludeOutbox);requiresUserSignedIn=$true;wakesComputer=$false;paidModelExecution=$false}|ConvertTo-Json -Compress
