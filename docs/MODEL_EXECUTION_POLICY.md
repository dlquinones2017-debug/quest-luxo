# Model execution: zero-dollar policy

The repository model entry point is held under `config/agents/model-execution-policy.json`: disabled, daily budget zero. `node scripts/model-execution.mjs status` reports the policy. `run` exits with code 2 before credential access, provider-session creation or network access. An environment flag or positive budget value cannot enable it. Invalid configuration fails closed.

This is an application control, not a provider account-wide billing limit. Existing deterministic pilot roles continue independently. Secrets stay outside version control, and the isolated synthetic pilot continues rejecting model credentials. No API requests or provider sessions are created to validate credentials while the approved budget is zero.

Paid execution requires a later explicit budget authorization and a reviewed implementation for cost reservations, token and tool limits, concurrent accounting, failure handling and reconciliation. Merely creating an API key or changing an enable flag does not authorize calls.
