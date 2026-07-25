# Collection Architecture Migration Checklist

Validated on 2026-07-25 against the shared collection and reference templates.
Every listed watch house has a registry-backed brand directory, collection route,
reference route, search, filters, sorting, breadcrumbs, lead CTA, canonical
metadata, structured data, analytics hooks, responsive behavior, and accessible
placeholder imagery.

| Watch house | Representative collection | Brand | Collection | Reference | Desktop | Tablet | Mobile |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rolex | Daytona | Pass | Pass | Pass | Pass | Pass | Pass |
| Patek Philippe | Nautilus | Pass | Pass | Pass | Pass | Pass | Pass |
| Audemars Piguet | Royal Oak | Pass | Pass | Pass | Pass | Pass | Pass |
| Richard Mille | RM 11 | Pass | Pass | Pass | Pass | Pass | Pass |
| Vacheron Constantin | Overseas | Pass | Pass | Pass | Pass | Pass | Pass |
| F.P. Journe | Chronomètre Bleu | Pass | Pass | Pass | Pass | Pass | Pass |
| Hublot | Big Bang | Pass | Pass | Pass | Pass | Pass | Pass |
| Cartier | Santos de Cartier | Pass | Pass | Pass | Pass | Pass | Pass |
| Omega | Speedmaster | Pass | Pass | Pass | Pass | Pass | Pass |
| Tudor | Black Bay | Pass | Pass | Pass | Pass | Pass | Pass |
| Panerai | Luminor | Pass | Pass | Pass | Pass | Pass | Pass |
| Breitling | Navitimer | Pass | Pass | Pass | Pass | Pass | Pass |
| IWC | Pilot's Watch | Pass | Pass | Pass | Pass | Pass | Pass |
| Blancpain | Fifty Fathoms | Pass | Pass | Pass | Pass | Pass | Pass |
| Jaeger-LeCoultre | Reverso | Pass | Pass | Pass | Pass | Pass | Pass |
| Ulysse Nardin | Freak | Pass | Pass | Pass | Pass | Pass | Pass |
| Franck Muller | Vanguard | Pass | Pass | Pass | Pass | Pass | Pass |
| Bell & Ross | BR 03 | Pass | Pass | Pass | Pass | Pass | Pass |
| A. Lange & Söhne | Lange 1 | Pass | Pass | Pass | Pass | Pass | Pass |
| Breguet | Classique | Pass | Pass | Pass | Pass | Pass | Pass |
| Girard-Perregaux | Laureato | Pass | Pass | Pass | Pass | Pass | Pass |
| Zenith | Chronomaster Sport | Pass | Pass | Pass | Pass | Pass | Pass |

## Shared architecture gates

- [x] One registry drives every brand, collection, and reference static route.
- [x] One collection template drives every collection page.
- [x] One reference template drives every reference page.
- [x] Route helpers canonicalize every URL segment and reference identifier.
- [x] Search, filter, sort, empty state, loading, and placeholder behavior are shared.
- [x] Breadcrumbs, CTA routing, SEO metadata, JSON-LD, and analytics hooks are shared.
- [x] Legacy collection page implementations have been removed.
- [x] Route regression tests traverse every registered brand, collection, and reference.
- [x] Production-mode build generates 132 pages.
- [x] Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100.

## External launch gates

- [ ] Confirm that `contact@questluxo.com` accepts and delivers a real message.
- [ ] Merge/push the verified revision to the production branch.
- [ ] Confirm the Render deployment is live and run the same route matrix in production.
- [ ] Replace neutral reference placeholders with approved product photography when supplied.
