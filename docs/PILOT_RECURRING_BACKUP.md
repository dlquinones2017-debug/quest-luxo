# Synthetic pilot recurring recovery

The opt-in pilot channel exports only three exact encrypted synthetic fixtures: pipeline, intake, and CRM preparation. It does not expose customer data, keys, reports, general file paths, or a business-data endpoint. Set `QUEST_ENABLE_PILOT_BACKUP_EXPORT=true` only on the existing isolated synthetic pilot. Leave production unchanged.

Every GET and ACK uses a purpose-derived HMAC, exact method/path/body digest, client identity, fresh canonical timestamp and single-use nonce. The signed response binds the request nonce. The ACK must match the delivered archives and freshly rechecked current primaries. Bodies, deadlines, profiles and pending challenges are bounded. Checkpoints are signed, private, locked and atomically persisted.

The Windows client pins the existing HTTPS pilot origin and rejects redirects. It authenticates all three exact fixtures, retains a new exclusive run, restores and reads back each store, checks owner-only ACLs and reparse ancestry, and acknowledges only after all checks pass. Existing runs are preserved. At 1,000 runs it holds for a reviewed retention decision. A retained lock after a crash requires review; it is not automatically removed by another process.

Use the existing approved private recovery tree and existing DPAPI CurrentUser key. Copy the four standalone modules and reviewed PowerShell wrapper there after verifying their source hashes. Execute the reviewed registration body inline with `$Root` set; it embeds the wrapper and pins the four module hashes. It creates a limited current-user interactive Windows task, without a password, elevation or execution-policy changes. Two initial unattended acceptance triggers are separated by 90 seconds; subsequent runs repeat every six hours. The task requires this Windows user to be signed in and the laptop to be awake and online. It does not wake the computer.

Recurring evidence requires two matching acknowledged recovery cycles at least 60 seconds apart. Evidence expires 12 hours after the latest accepted cycle and resets after revision changes or a longer gap. The recovery agent independently verifies the checkpoint HMAC and compares all three current primary revisions. The key holder's authenticated recovery attestation is the evidence boundary; this is not hardware remote attestation. Initial automatic task results must be observed before claiming unattended operation.

Even with current recurring recovery, business execution remains held for verified business sources, reviewed field mappings and runtime authorization. Gmail, CRM writes and paid model calls remain disabled. An unhealthy or stale backup channel does not grant any new business permission.

Disable future exports by setting the pilot toggle to `false` and deploying its existing branch. Disable the named Windows task to stop transfers; preserve its retained archives. Neither step changes production or deletes recovery data.
