# Optional communication preferences — October 24, 2026

Status: implemented and locally verified; not deployed. This is a reviewable website repair, not confirmation of SMS registration approval.

## Behavior

Both `/begin-your-quest` and `/contact` offer independent, optional, unchecked email-newsletter, promotional-text and inquiry-text choices. Every choice can remain unchecked. Providing a phone number does not imply SMS consent. A selected SMS category requires a plausible phone number; inquiries without SMS choices keep phone optional. Existing URLs, intake context, notification workflow and analytics controls remain intact. The secondary contact form now displays its existing successful response reliably when the API returns only `success: true`.

The active TypeScript intake API accepts only current-version, strictly boolean preferences. Storage derives the disclosure snapshot and receipt timestamp on the server and discards client-supplied evidence. Records include the wording, version, independent selections, legal entity, submitted form source and server receipt time. The source is explicitly a submitted form assertion, not verified phone ownership. All-false choices have no affirmative-consent timestamp. Legacy records remain valid. Status, note and delivery updates preserve saved evidence. These fields do not establish campaign eligibility, reverse suppression, enroll recipients or send SMS/newsletters.

Public About/footer identify Quelux Enterprises LLC. Privacy and Terms describe the optional channels, mobile opt-in handling, STOP/HELP, rates, frequency, delivery limitations and support. Existing analytics consent remains separate.

## Verified

- 26 focused tests passed; one POSIX file-mode test skipped on Windows. Coverage includes legacy compatibility, strict/stale/ambiguous choices, independent categories, phone validation, forged evidence rejection, API rejection before persistence, temporary JSONL readback and concurrent writes, public funnel and photography provenance.
- Astro check: zero errors, zero warnings, 18 existing hints.
- Production build passed. Existing bundle-size, duplicate Zenith route and robots-source warnings remain.
- Desktop 1280 px and mobile 390 px: all three choices unchecked/optional, policies linked, no horizontal overflow. No live test leads or customer records were used.
- Front-facing Encrypto baseline `b69a409` and all photography assets are unchanged.

Social/WTS subsequently reviewed implementation commit `8c4bf97` and reported nine passing independent offline checks with no blocking manual-form defect. The review did not establish registration approval. Any downstream mapping must respect each category boolean independently, retain existing suppressions and distinguish submitted choices from verified phone ownership.

## Registration owner handoff / unresolved requirements

Social/WTS chat `6adbd889-9630-83e9-8b55-4f1059c89ebc` confirms the campaign remains rejected, with no resubmission. The retained registration's exact Brand Website URL, Quick Setup versus Manual method, original legal/brand payload and generated widget embed are unavailable in inspected views. Rejection 30909 alone does not establish the selected method.

Obtain the retained submission payload before selecting the final repair. If Quick Setup is retained, publish its actual generated A2P widget at the exact registered URL and check private/public access. Do not present these custom checkboxes as that widget. If Manual is selected by the owner, align the registered method/description/screenshots with the actual optional forms. Preserve the working inquiry funnel. Confirm the registered business homepage is reachable and matches the submitted brand for 30891. Website changes alone cannot establish provider/carrier approval.

Social/WTS retains submission, suppression review, audiences, workflow activation and spending ownership. No registration changes, paid action or audience import is included here. Existing website-use authorization does not authorize external vendor messages.

Official references reviewed:

- https://help.gohighlevel.com/support/solutions/articles/155000004746-campaign-rejection-reasons-and-resolutions
- https://help.gohighlevel.com/support/solutions/articles/155000008307-pre-built-a2p-campaign-registration-with-chat-widget
- https://docs.astro.build/en/basics/astro-components/
- https://docs.astro.build/en/guides/styling/

Local review screenshots are in the existing task evidence folder: `wts-consent-desktop.png` and `wts-consent-mobile.png`.
