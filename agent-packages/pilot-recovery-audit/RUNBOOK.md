# Generated pilot recovery auditor

Role: reliability-qa-and-incident-response-agent. Mode: PILOT_LOCAL_READ_ONLY.

The existing isolated pilot invokes this package after its storage checks. Its standalone runner assumes no successful storage checks and holds. It reads only the fixed synthetic stores and a private operator-observed recovery receipt. Evidence expires after 24 hours or when either revision changes. A one-time independent recovery cannot establish recurring retention or business-data authorization. Missing or conflicting evidence holds. No network, key export, dispatch, connector or production writes.

Validate offline: node --test agent-packages/pilot-recovery-audit/agent.test.mjs
