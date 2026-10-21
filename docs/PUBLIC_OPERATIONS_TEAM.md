# Three live public operations roles

The existing isolated service coordinates three bounded deterministic agents on a five-minute cycle. No new service, model API, subscription, Gmail automation, CRM automation or customer-data integration is introduced.

| Architecture role | Generated package | Live task |
|---|---|---|
| Website Product | `website-health` | Observe fixed public roots for Luxury Advisory, Realty and Capital Advisory with bounded HEAD requests |
| Enterprise Risk | `public-incident-triage` | Validate observations, distinguish access/network restrictions from server errors, and produce review actions |
| Founder Chief-of-Staff & Approval | `public-operations-brief` | Consume matching observations and incident assessment to produce an internal availability/exception brief |

The roles share one immutable public observation. The triage and brief add no network requests. They cannot dispatch work, send messages, change production, read customer records, write CRM or activate Gmail. They use rules and verified tool observations; they are not LLM-backed autonomous workers.

## Validation and source boundaries

Consumers check the complete observation schema, exact division/URL identities, HTTP classification, timestamps, durations, count consistency and all disabled-permission flags. Unknown/raw fields, altered URLs, inconsistent counts or classifications fail closed. Observations older than the five-minute cadence plus thirty seconds yield HOLD. A future observation is rejected.

The triage distinguishes restricted access, redirects, unsupported HEAD, rate limiting, missing routes, server responses, network failure and timeouts. It recommends bounded review actions and never performs remediation. The founder brief requires a matching incident assessment. It reports `businessPipeline: NOT_CONNECTED`, without fabricating cases, financial figures or customer activity. Public HTTP success does not validate forms, site content or the entire route tree.

## Runtime and Factory

Each package is role/tool/schema-bound under Factory version 3 and PUBLIC_READ_ONLY permissions. Standalone runners may obtain a new observation from the fixed public targets. In the service, one website check feeds both consumers, and structured completion events provide runtime evidence. Offline generated tests use explicit synthetic HTTP fixtures, including access restriction and server-error cases.

The public team is separate from critical encrypted-storage monitoring. Public-site failures do not restart a healthy storage service. The health endpoint exposes freshness and counts three live public agents only after the full public chain succeeds; stale or failed results cannot retain that count.

The three existing operations/readiness/founder packages continue synthetic acceptance evaluation. There are six generated packages in this checkpoint, with three live public role tasks and three synthetic packages. The founder role has both a synthetic evaluation package and a public-operations package; these are not two different architecture roles. The 57-role responsibility roster remains unchanged and must not be described as 57 running workers.

## Recovery and business-data status

Authenticated pipeline and intake-journal recovery checks run separately each minute with exact synthetic fixtures. Independent founder-controlled key custody, recurring offsite retention and reviewed business-source ownership remain prerequisites for real business-data activation. The live public team does not clear those gates. Production deployment and existing approved functionality remain separate from the isolated rollout.
