# Pilot Command Orchestrator

The version 5 Factory template binds the existing Command Orchestrator role to three input domains: a public operations brief backed by its exact fixed-target observations, a bounded recovery audit, and the disabled model policy. It creates a small internal recommendation queue with registered owner roles and explicit priorities. It has no dispatch, network, connector, key-export, provider-session or production-write tool.

The consumer rebuilds the public brief from the original observations. Unexpected fields, false counts, inconsistent recovery flags, permission changes and nonzero model policies fail closed. Public observations expire after 330 seconds; recovery assessments expire after 120 seconds. Expired public results become unknown. Independent recovery cannot remain verified after its receipt expires. Storage and local-recovery failures take highest priority, followed by incidents and independent-recovery gaps, then recurring offsite retention and source-scope review. The explicit zero-dollar model policy is an expected operating constraint and does not generate payment-approval tasks.

The isolated pilot invokes the orchestrator after public checks and subsequent recovery checks, reusing the same three HEAD requests per public cycle. Its health output counts this fifth live role only while the underlying critical storage monitor, public team, recovery audit and command result are current. Command assessment failures hold that role without restarting a healthy storage pilot. Reports and queues stay in internal runtime logs; no new HTTP endpoint serves them.

The 57-role source roster describes the architecture. Generated packages are source artifacts. Current runtime checks establish the live-role count. A fresh recommendation queue still reports HOLD for business-data execution until recurring independent retention and a reviewed business source exist. No customer records, business pipeline counts or revenue are inferred from website availability.

Offline validation: `node --test tests/pilotCommandOrchestrator.test.mjs agent-packages/pilot-command-orchestrator/agent.test.mjs`.

The standalone generated live runner requires trusted source reports from the pilot and refuses to synthesize live evidence. Generated offline tests use only explicit fixtures.
