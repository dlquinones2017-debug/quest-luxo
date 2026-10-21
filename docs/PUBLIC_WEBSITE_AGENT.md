# Live public website operations agent

The Website Product role now has a generated version 3 package that performs a real, bounded operating task. It observes the three approved Quest Luxo public website roots every five minutes inside the existing isolated service. It requires no model API, new service, subscription or customer-data integration.

The Factory restricts this template to role `website-product`, tool `public-http.head`, input `approved-public-website-targets`, output `public-website-health-v1`, and mode `PUBLIC_READ_ONLY`. Specification text cannot supply an arbitrary URL, shell command or credential. All external-write, Gmail, CRM and production-mutation permissions remain false. Version 1 and 2 synthetic packages retain their existing boundaries.

```sh
node agent-packages/website-health/run.mjs
node --test agent-packages/website-health/agent.test.mjs
```

The runner performs live checks. The generated test uses an explicit offline HTTP fixture and does not prove live availability. Initial Factory generation produced four files in 11 ms, excluding tests, review and deployment.

## Observations and limits

Only three fixed HTTPS root URLs are checked. Requests use HEAD, omit credentials, refuse redirects, cache nothing and have a ten-second timeout. The agent never downloads site content, follows redirect destinations, reads forms/customer records or accesses signed-in accounts. Observations include division, public URL, HTTP status, elapsed time and a bounded classification.

| Observation | Meaning |
|---|---|
| RESPONDING | This checker received a 2xx response |
| REDIRECT_REVIEW | Redirect observed; destination was not followed |
| ACCESS_RESTRICTED | 401/403; access restriction, not proof of global outage |
| HEAD_UNSUPPORTED | 405; this method cannot establish availability |
| RATE_LIMITED | 429; rate restriction observed |
| NOT_FOUND / SERVER_ERROR | 404 or 5xx response from this check |
| NETWORK_ERROR / TIMEOUT | The checker could not establish a response |

A passing HEAD response does not establish content accuracy, lead-form delivery, image quality or all-route health. Network failures and access restrictions are location-dependent observations. The agent logs structured results without forwarding exception text, response bodies, headers, tokens or raw customer data. It does not send alerts through email or modify a site.

The monitor prevents overlapping checks and marks observations stale after the five-minute interval plus a thirty-second allowance. The health endpoint exposes whether the public checker is CURRENT, STALE or CHECK_FAILED, separately from critical encrypted-storage health. An external website failure does not restart an otherwise healthy storage pilot.

## Deployment accounting

This is one live public-read agent package. The three existing operations/readiness/founder-brief packages still run synthetic acceptance evaluations. The encrypted intake adapter and its backup checks are prepared and exercised only with synthetic receipts. The 57-role architecture is not a count of running autonomous workers. No LLM-backed workforce, Gmail automation, CRM automation or real business-data processing is activated by this release.
