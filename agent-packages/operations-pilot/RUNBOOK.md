# Generated operations report

Status: SYNTHETIC PACKAGE ONLY. Not deployed or authorized for business data.

Role: lead-operations. Owner and approval provenance: see agent.json.

Run from repository root: node agent-packages/operations-pilot/run.mjs

Validate: node --test agent-packages/operations-pilot/agent.test.mjs

The runner reuses the existing encrypted pipeline and report implementation with fixed synthetic fixtures. No credentials, live source adapters, Gmail, CRM, network, scheduler or production writes. Unknown permissions or unsupported roles fail closed.

Release requires reviewed data authorization, independent encrypted retention and recovery, observability and separate deployment approval. Creating a spec cannot grant access.
