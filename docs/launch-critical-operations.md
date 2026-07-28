# Watches MVP Critical Operations

## Production prerequisites

- Render web service on a paid plan that supports a persistent disk.
- Persistent disk mounted at `/var/data/quest-luxo`.
- HTTPS public origin assigned to `SITE_URL`.
- Verified email sending domain and provider API key.
- Confirmed inquiry recipients and a named daily queue owner.
- Monitoring for health-check failures, HTTP 5xx responses, rate-limit volume,
  and `Quest Luxo lead notification failed` log events.

Production startup is fail closed. `node scripts/start-production.mjs` verifies
required settings and a synchronized write probe before it starts Astro.

## Email verification gate

Before public traffic is enabled:

1. Verify the sending domain with the email provider.
2. Publish and validate SPF and DKIM records.
3. Publish a DMARC policy and a monitored aggregate-report mailbox.
4. Confirm `LEAD_EMAIL_FROM` uses the verified domain.
5. Confirm every `LEAD_EMAIL_TO` recipient accepts a test notification.
6. Submit one production smoke inquiry, confirm provider acceptance, inbox and
   spam placement, reply-to behavior, and the persisted JSONL record.
7. Remove or archive the smoke record under the normal retention process.

## Backup and recovery

Back up the persistent lead file at least daily to a separately controlled,
encrypted destination. The built-in commands validate JSONL structure and IDs:

```text
node scripts/lead-storage.mjs verify /var/data/quest-luxo/leads.jsonl
node scripts/lead-storage.mjs backup /var/data/quest-luxo/leads.jsonl /secure-backups
node scripts/lead-storage.mjs restore /secure-backups/leads-<timestamp>.jsonl /var/data/quest-luxo/leads.jsonl --confirm
```

Restore creates a pre-restore copy when a current file exists. Validate the
restored file, restart the single application instance, and confirm the latest
expected lead before reopening intake.

## Abuse and incident response

The lead endpoint enforces same-origin production requests, JSON content type,
a 16 KiB hard body limit, a hidden bot field, a minimum completion time,
bounded per-client rate limiting, privacy-preserving keyed client identifiers,
and generic client errors. If abuse exceeds application limits, add a Render
edge or upstream WAF rule without weakening legitimate accessibility.

For an incident, disable public intake at the edge, preserve relevant logs,
rotate the email API key and abuse-hash secret if exposed, validate lead storage,
notify the responsible owner, and document recovery approval before restoring
traffic.
