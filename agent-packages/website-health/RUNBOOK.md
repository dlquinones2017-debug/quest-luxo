# Generated public website health agent

Role: website-product. Mode: PUBLIC_READ_ONLY.

Run: node agent-packages/website-health/run.mjs

Validate offline: node --test agent-packages/website-health/agent.test.mjs

The runner issues bounded HEAD requests to the three fixed Quest Luxo public website roots. No redirects, response bodies, credentials, customer data, sends, CRM, Gmail or production changes. Tests use a synthetic HTTP reader; they cannot prove live availability. Access restrictions and network failures are observations from the checker location, not proof of global outage. The existing pilot schedules this package every five minutes. No new paid infrastructure.
