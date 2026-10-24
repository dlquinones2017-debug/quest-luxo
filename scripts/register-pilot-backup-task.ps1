# Run this reviewed registration body inline with $Root set to the approved private recovery tree.
# Creates one current-user interactive task; no elevation, stored password or execution-policy change.
$ErrorActionPreference='Stop'
$taskName='QuestLuxo-Synthetic-Pilot-Backup'
if(Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue){throw 'Existing task requires review; registration held'}
$Root=[IO.Path]::GetFullPath($Root)
$files=@('pilot-backup-protocol.mjs','pilot-independent-recovery.mjs','crm-preparation-independent-recovery.mjs','pilot-recurring-backup-client.mjs')
$expected=@{}
foreach($name in $files){$expected[$name]=(Get-FileHash -LiteralPath (Join-Path $Root $name) -Algorithm SHA256).Hash.ToLowerInvariant()}
$literal='$Root='''+$Root.Replace("'","''")+''';$ExpectedFiles=@{'
foreach($name in $files){$literal+=''''+$name+'''='''+$expected[$name]+''';'}
$literal+='};'+[Environment]::NewLine
$body=$literal+[IO.File]::ReadAllText((Join-Path $Root 'pilot-recurring-windows.ps1'))
$encoded=[Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($body))
$action=New-ScheduledTaskAction -Execute (Join-Path $PSHOME 'powershell.exe') -Argument ('-NoProfile -NonInteractive -EncodedCommand '+$encoded)
$who=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal=New-ScheduledTaskPrincipal -UserId $who -LogonType Interactive -RunLevel Limited
$start=Get-Date
# Two unattended acceptance triggers are separated by 90 seconds; ongoing retention runs every six hours.
$first=New-ScheduledTaskTrigger -Once -At $start.AddSeconds(30)
$second=New-ScheduledTaskTrigger -Once -At $start.AddSeconds(120)
$ongoing=New-ScheduledTaskTrigger -Once -At $start.AddHours(6) -RepetitionInterval (New-TimeSpan -Hours 6)
$settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 3) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$task=New-ScheduledTask -Action $action -Trigger @($first,$second,$ongoing) -Principal $principal -Settings $settings -Description 'Authenticated encrypted synthetic pilot backups; DPAPI CurrentUser recovery; no business-data or paid-model execution.'
Register-ScheduledTask -TaskName $taskName -InputObject $task | Out-Null
$actual=Get-ScheduledTask -TaskName $taskName
if($actual.Principal.LogonType -ne 'Interactive' -or $actual.Principal.RunLevel -ne 'Limited' -or $actual.Actions.Count -ne 1 -or $actual.Triggers.Count -ne 3){throw 'Unexpected registered task'}
[pscustomobject]@{status='REGISTERED';taskName=$taskName;user=$who;logonType=$actual.Principal.LogonType.ToString();runLevel=$actual.Principal.RunLevel.ToString();firstAutomaticRun=$first.StartBoundary;secondAutomaticRun=$second.StartBoundary;recurrence='PT6H';requiresUserSignedIn=$true;wakesComputer=$false;paidModelExecution=$false}|ConvertTo-Json -Compress
