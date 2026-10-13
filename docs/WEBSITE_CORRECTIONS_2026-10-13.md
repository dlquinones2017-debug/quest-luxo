# Website corrections — October 13, 2026

Founder request: enforce the attached isolated-watch-on-white examples across website photography; remove the exact phrase “Availability not confirmed” everywhere; investigate Cartier Pasha and Ballon Bleu 502 errors.

## Source corrections and validation

- Removed the prohibited default from both shared catalog generators. Unknown production status is omitted rather than replaced by a stock or availability assertion; empty production rows/cards are also omitted.
- Rejected six legacy images from the website delivery registry: AP 15202ST wrist shot; Omega Moonwatch dial macro; Tudor Black Bay 54 wrist shot; Cartier Santos contextual photo; Breitling Navitimer contextual photo; Ulysse Nardin Freak Vision dark studio photo. Original files and provenance remain preserved.
- Corrected false white-background metadata on AP, Omega and Cartier. Reference photograph selection now requires a white background. Existing compliant exact-reference cutouts, including the supplied Blast and Aquanaut examples, remain intact.
- AP 15202ST has no verified complete isolated replacement in this checkout or the connected asset searches. Its photography is explicitly pending; do not substitute the newer 15510ST or reconstruct obscured bracelet sections.
- Seven focused catalog/photography tests passed. Production build passed; all 275 generated HTML pages have zero prohibited wording matches. Astro check reports zero errors. Both Cartier collection routes build.

## Cartier gateway investigation

Screenshots show Render 502 responses around 17:45 Eastern, with edge request IDs a4a18753fe5607fa-ATL and a4a187a1092307fa-ATL. Render deployment dep-db7acctbedkc738cjgvg began at 21:44:19Z, entered deployment at 21:44:43Z, and was live at 21:45:11Z. Both public collection routes subsequently returned HTTP 200. No matching 5xx request logs were returned for the investigated window.

Production service srv-d9h9btsvikkc73ahrff0 has a persistent disk at /var/data. Render explicitly documents that disks disable zero-downtime deployment and stop the previous instance before starting the replacement: https://render.com/docs/disks#disk-limitations-and-considerations. Deployment interruption is therefore the leading explanation, not a proven request-level root cause. Permanent elimination requires separating durable lead storage from the public web instance or another reviewed hosting migration; do not remove the disk or risk lead data as a cosmetic fix.

Production publication and live verification are recorded separately after deployment succeeds.
