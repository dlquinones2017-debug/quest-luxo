# Agent Factory: three distinct synthetic templates

This update extends the existing Factory and shared isolated pilot. It adds no service, subscription, API provider, CRM, or competing orchestrator.

| Template | Architecture role | Reviewed output |
|---|---|---|
| Operations | Lead Operations Agent | Existing Capital/Realty aggregate exception counts |
| Readiness | Reliability, QA & Incident Response Agent | Seven required evidence checks, specific holds and review readiness |
| Founder brief | Founder Chief-of-Staff & Approval Agent | Existing pipeline aggregates combined with readiness requirements |

The two specialist specifications use version 2. Version 1 operations packages remain compatible. Templates bind the role, allowed tools, input fixture, output schema, evaluation and permissions. Unsupported combinations are rejected. A package's description is never treated as executable code or permission.

## Readiness policy

The assessor checks storage, local recovery, offsite recovery, key recovery, retention policy, monitoring and source scope. Missing evidence remains missing; conflicting or future evidence is held; evidence older than 24 hours is stale. Duplicate checks, unknown fields, invalid dates and credential-like evidence references are rejected.

Even all-verified evidence produces only `READY_FOR_FOUNDER_REVIEW`. It never grants business-data execution, enables a connector, sends messages or writes CRM. A founder brief cannot dispatch work. An absent pipeline is represented as missing rather than zero cases; malformed counts, incorrect division identities and embedded raw records fail closed.

The reviewed synthetic fixture intentionally lacks key-recovery, retention-policy and source-scope evidence. Both specialists must report those three holds. This fixture is an evaluation input, not a claim about live readiness.

## Generation and validation

```sh
npm run agent:factory -- generate config/agents/reliability-pilot.spec.json
npm run agent:factory -- generate config/agents/founder-brief-pilot.spec.json
node --test agent-packages/*/agent.test.mjs
```

The checked-in packages already exist; repeat generation refuses replacement. Initial generation measured 6 ms per four-file specialist package on the development host, excluding review, tests and deployment.

The existing pilot validates all three synthetic templates at startup and during its bounded monitoring cycle. Failure of an expected result or permission boundary prevents healthy readiness. No extra model workers, external credentials, live-data adapters or paid resources are activated. The existing 57-role architecture still represents responsibilities; this checkpoint covers three validated templates, not 57 deployed autonomous workers.

## Remaining real-data prerequisites

Independent key recovery, recurring offsite retention for changing datasets, incident ownership and a verified read-only first-source contract remain technical requirements. Standing founder authorization permits work within scope; it cannot replace evidence of successful key recovery or an available source adapter. The pilot retains its business-data hold and its disabled Gmail/CRM boundaries.
