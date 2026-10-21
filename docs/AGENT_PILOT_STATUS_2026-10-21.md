# Isolated operations-agent pilot: verified synthetic execution

This checkpoint supersedes the pre-activation status in the initial pilot runbook. The pull request remains draft and unmerged. No production release is authorized by this checkpoint.

## Completed

- The existing isolated pilot was upgraded after founder approval and configured with encrypted persistent storage and a managed pilot-only key.
- The tested operations-agent runtime replaced the placeholder and passed its hosted startup acceptance check.
- The manual aggregate report returned the expected synthetic Capital and Realty exception counts.
- All 10 hosted smoke tests and the generated operations-package acceptance test passed.
- An actual encrypted synthetic backup was retained outside the hosting provider, independently retrieved and authenticated in a fresh recovery process on a separate host. Revision, sequence and fixture contents matched.
- A controlled redeploy recovered the existing synthetic snapshot without creating duplicate records.
- The readiness endpoint passed. No report, key, backup or mutation endpoint is exposed.
- The private execution evidence is retained separately from this repository. Infrastructure identifiers, backup contents, recovery metadata and credentials are excluded from this public status update.

## Scope and remaining gates

This is one controlled synthetic operations pilot and one generated agent package. The 57-role architecture remains a roster of responsibilities, not 57 running agents. Production is unchanged; Gmail and CRM automation remain disabled.

The complete backup/business-data readiness flags remain false. Before business-data activation, complete founder-controlled key escrow and tested retrieval outside the hosting provider, a defined backup retention/rotation policy, monitoring and incident ownership, and source-specific authorization. The successful synthetic round trip does not establish a complete provider-account-loss or production recovery plan.

## Validation

The deployed implementation passed 382 local tests, type checking, photography integrity/queue checks and the production build. GitHub Quality passed for that implementation. The additional hosted checks above confirm runtime execution and restart recovery rather than relying on a live-service label alone.
