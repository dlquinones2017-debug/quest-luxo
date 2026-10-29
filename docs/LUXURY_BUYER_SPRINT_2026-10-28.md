# Luxury buyer and inquiry improvements — October 28, 2026

Initial release PR #88 is verified live as `71db5f95d57e2f0a17ce921aecafe9867ff6425f`, Render deploy `dep-dbh9jgqvcj2c73frbud0`. GitHub Quality passed all 335 regression tests, diagnostics, photography checks and production build; Watch Brokerage Acceptance passed. Branded production reference pricing, loaded photos and exact-reference intake context were checked without submitting a live inquiry.

## Buyer experience

Reference cards retain authentic approved photographs, exact identities, primary configuration, production/material tags, reference navigation and a contextual sourcing action. Configuration/specification/advisory detail remains expandable. Cards now use the same verified retail registry as reference pages, rather than legacy configuration prices. A list price is a benchmark, not inventory, a market valuation or a sourcing offer.

Intelligence uses the 297 unique active reference routes. Twenty legacy collection/family records are no longer presented as exact watches. Brand and one documented feature filter intersect the natural-language query, brand exclusions and verified budget rules. Results include approved photographs, more-results navigation and the shared intake URL builder. Corrected visible Moonwatch SKU searches retain its existing public route and internal identity.

Collection facets are derived from the actual collection. All-precious-metal excludes steel/gold and Rolesor configurations. Reference pages expose a sourcing action earlier and omit duplicated Investment/Confidence score panels. Missing qualitative ratings remain unassessed. Gift/deadline guidance uses the existing Message field; no new customer-data schema or delivery promise is introduced.

## Pricing evidence

- The initial release priced 113 of 297 canonical references; 184 remained explicitly unknown. A following 30-observation candidate raises coverage to 143/297 with 154 unknown; it requires its own release verification.
- Seventy new exact manufacturer prices: 54 Omega, nine IWC, seven Breitling.
- Every observation includes exact configuration, currency, market, source URL, observation date and tax basis. Observation dates are not price-effective dates. No FX conversion or dealer asking price is used as manufacturer MSRP.
- IWC explicitly displays VAT excluded; Breitling displays sales tax excluded. Omega tax basis remains unconfirmed. Prior Rolex/Tudor tax-basis uncertainty is preserved.
- Evidence: `WATCH_RETAIL_PRICING_EVIDENCE_2026-10-28.json`, its `_FOLLOWUP` ledger and `WATCH_RETAIL_PRICING_COVERAGE_2026-10-28.json`. Reviewed holds include retired/no-price references, regional/currency ambiguity and replacement-model redirects. No related-model substitution.
- Next-tranche evidence is `WATCH_RETAIL_PRICING_EVIDENCE_2026-10-28_NEXT.json`: 11 Patek Philippe, six Cartier, five Hublot and one Panerai. Patek evidence contains explicit USD/US manufacturer price objects; generic collection labels are matched to exact photographed manufacturer references. Seven reviewed holds remain excluded.
- `_NEXT_EXTRA.json` adds six Tudor and one Breitling observation. Tudor raw public country/currency data establishes US/USD; tax basis remains unconfirmed. The Monochrome benchmark uses pictured three-link `-0001` ($5,325), excluding the five-link `-0003` ($5,450). Reviewed 404/retired/variant holds remain unknown.

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

Astro diagnostics: zero errors and warnings, existing hints retained. Build warnings include the large intelligence client chunk, duplicate Zenith route entry and public `robots.txt` conflict. The initial release CI and deployment are recorded above; following pricing tranches require their own verification.
