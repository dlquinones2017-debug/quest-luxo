# Luxury buyer and inquiry improvements — October 28, 2026

Release candidate; production deployment must be verified independently.

## Buyer experience

Reference cards retain authentic approved photographs, exact identities, primary configuration, production/material tags, reference navigation and a contextual sourcing action. Configuration/specification/advisory detail remains expandable. Cards now use the same verified retail registry as reference pages, rather than legacy configuration prices. A list price is a benchmark, not inventory, a market valuation or a sourcing offer.

Intelligence uses the 297 unique active reference routes. Twenty legacy collection/family records are no longer presented as exact watches. Brand and one documented feature filter intersect the natural-language query, brand exclusions and verified budget rules. Results include approved photographs, more-results navigation and the shared intake URL builder. Corrected visible Moonwatch SKU searches retain its existing public route and internal identity.

Collection facets are derived from the actual collection. All-precious-metal excludes steel/gold and Rolesor configurations. Reference pages expose a sourcing action earlier and omit duplicated Investment/Confidence score panels. Missing qualitative ratings remain unassessed. Gift/deadline guidance uses the existing Message field; no new customer-data schema or delivery promise is introduced.

## Pricing evidence

- 113 of 297 canonical references have sourced published U.S. list benchmarks; 184 remain explicitly unknown.
- Seventy new exact manufacturer prices: 54 Omega, nine IWC, seven Breitling.
- Every observation includes exact configuration, currency, market, source URL, observation date and tax basis. Observation dates are not price-effective dates. No FX conversion or dealer asking price is used as manufacturer MSRP.
- IWC explicitly displays VAT excluded; Breitling displays sales tax excluded. Omega tax basis remains unconfirmed. Prior Rolex/Tudor tax-basis uncertainty is preserved.
- Evidence: `WATCH_RETAIL_PRICING_EVIDENCE_2026-10-28.json`, its `_FOLLOWUP` ledger and `WATCH_RETAIL_PRICING_COVERAGE_2026-10-28.json`. Reviewed holds include retired/no-price references, regional/currency ambiguity and replacement-model redirects. No related-model substitution.

## Saved-inquiry notification contract

The active TypeScript submission path persists first, then constructs validated context from the returned ID and saved timestamp. Current records use `lead_<UUID>`; bounded opaque legacy IDs, including storage's fallback hashes, and valid ISO timestamp variants remain supported on retry. The stored values are preserved. The first bounded plain-text event block contains:

```text
Quest Luxo canonical inquiry event
Contract-Version: 1
Source-System: luxury-canonical-jsonl
Lead-ID: <server persistence result>
Saved-At: <server persistence result>
Event-Key: luxury-inquiry-v1/<server persistence result>
End-Canonical-Event
```

HTML includes the same escaped labels. Intake-supplied identity fields are not accepted. The public API stays `{success:true}`. A notification failure preserves saved-submission success. `notifySavedLead` accepts an existing stored record to retry without creating another inquiry, retaining the same event key; it is a helper, not a newly deployed retry worker or delivery-status scheduler. The approved Luxury signature appears once per outgoing text/HTML representation.

Downstream consumers must read the initial bounded event block from an authenticated notification, validate source/version/ID/time, and ignore any similarly named labels inside user-entered message fields. Event identity supports deduplication; this release does not itself establish HubSpot delivery, durable downstream checkpoints, owner follow-up or revenue. The workforce owner retains integration validation.

## Verification

Focused tests cover pricing evidence, precise budget/exclusion rules, canonical routes, documented facets, notification context/spoofing, persistence-before-notification, failure semantics, retry identity and escaping. Existing intake/write-safety tests use synthetic temporary fixtures. Browser QA covers desktop/mobile search and collection cards, loaded authentic photos, expanded details and reference-context transfer into intake. No live inquiry, customer-data mutation or test email is part of this release verification.

Astro diagnostics: zero errors and warnings, existing hints retained. Production build succeeds with the existing duplicate public `robots.txt` warning. Final CI and deployed commit verification are recorded in the release handoff.
