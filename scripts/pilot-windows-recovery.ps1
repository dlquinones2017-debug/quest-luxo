param(
  [Parameter(Mandatory=$true)][string]$Root,
  [ValidateSet('restore','verify')][string]$Mode='verify'
)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
$key=$null
try {
  $Root=[IO.Path]::GetFullPath($Root)
  $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
  # Windows ACLs, rather than POSIX mode bits, protect this dedicated recovery tree.
  $rootAcl=Get-Acl -LiteralPath $Root
  if(-not $rootAcl.AreAccessRulesProtected){throw 'Inherited root ACL'}
  $items=@(Get-Item -LiteralPath $Root)+@(Get-ChildItem -LiteralPath $Root -Recurse -Force)
  foreach($item in $items){
    if(($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'Reparse point'}
    $acl=Get-Acl -LiteralPath $item.FullName
    if($acl.Owner -ne [Security.Principal.WindowsIdentity]::GetCurrent().Name){throw 'Unexpected owner'}
    foreach($rule in $acl.Access){
      if($rule.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -ne $sid -or $rule.AccessControlType -ne 'Allow'){throw 'Unexpected access rule'}
    }
    if(@($acl.Access).Count -eq 0){throw 'Missing access rule'}
  }
  $parent=[IO.DirectoryInfo]$Root
  while($null -ne $parent){
    if(($parent.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'Reparse ancestry'}
    $parent=$parent.Parent
  }
  $key=[Security.Cryptography.ProtectedData]::Unprotect(
    [IO.File]::ReadAllBytes((Join-Path $Root 'pipeline-key.dpapi')),
    [Text.Encoding]::UTF8.GetBytes('QuestLuxo.Pilot.Recovery.v1'),
    [Security.Cryptography.DataProtectionScope]::CurrentUser)
  if($key.Length -ne 32){throw 'Invalid recovery key'}
  $start=New-Object Diagnostics.ProcessStartInfo
  $start.FileName=(Get-Command node.exe -ErrorAction Stop).Source
  $start.Arguments='"'+(Join-Path $Root 'pilot-independent-recovery.mjs')+'" "'+$Root+'" '+$Mode
  $start.UseShellExecute=$false
  $start.RedirectStandardInput=$true
  $start.RedirectStandardOutput=$true
  $start.RedirectStandardError=$true
  $child=New-Object Diagnostics.Process
  $child.StartInfo=$start
  try {
    if(-not $child.Start()){throw 'Child failed'}
    # Transient anonymous pipe; key is absent from arguments, files, environment and output.
    $child.StandardInput.WriteLine(([BitConverter]::ToString($key)).Replace('-','').ToLowerInvariant())
    $child.StandardInput.Close()
    $output=$child.StandardOutput.ReadToEnd()
    $errors=$child.StandardError.ReadToEnd()
    $child.WaitForExit()
    if($child.ExitCode -ne 0){throw 'Recovery held'}
    $report=$output|ConvertFrom-Json
    if($report.status -ne 'VERIFIED' -or $report.mode -ne $Mode){throw 'Unexpected report'}
    $report|Add-Member -NotePropertyName device -NotePropertyValue $env:COMPUTERNAME
    $report|Add-Member -NotePropertyName keyProtection -NotePropertyValue 'DPAPI CurrentUser'
    $report|Add-Member -NotePropertyName aclVerified -NotePropertyValue $true
    $report|ConvertTo-Json -Depth 8 -Compress
  } finally {$child.Dispose()}
} catch {Write-Output 'WINDOWS_RECOVERY_HELD';exit 1}
finally {if($null -ne $key){[Array]::Clear($key,0,$key.Length)}}
