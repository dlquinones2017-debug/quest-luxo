# Division decision previews

Factory version 6 adds three role-bound synthetic packages to the existing isolated pilot. It reuses the pinned 57-role architecture and adds no infrastructure, model transport, connector, public endpoint or business-data permission.

| Package | Architecture role | Decision preview |
|---|---|---|
| `luxury-qualification-pilot` | Luxury Client Qualification Agent | Require brand, exact reference, positive budget, timeline, condition tolerance and box/papers preference; identify missing mandate requirements |
| `realty-economics-pilot` | Realty Underwriting Agent | Compute purchase + rehab + closing costs, ARV spread and optional annual net income / cost; flag zero or negative spread |
| `capital-package-pilot` | Capital Packaging Agent | Check positive requested amount, a supported business-purpose category and document-presence categories |

The fixed watch fixture holds for missing reference, condition and box/papers requirements. The fixed Capital fixture holds for missing documents. The fixed Realty fixture gives $130,000 cost and $30,000 spread before unmodeled costs, with unknown income represented as null. Those numbers are synthetic examples, not Quest Luxo opportunities or forecast revenue.

All required fields must be present. Explicit null indicates missing information; unknown or extra fields and invalid numeric values are rejected. Money accepts finite values with cent precision and bounded magnitude. Negative annual net income is supported. Unverified evidence suppresses all economics. Unknown financial values are never replaced by zero.

Watch completeness does not verify availability, authenticity, suitability or price. Property spread is not profit and excludes financing, holding, selling and other unmodeled costs. Income is caller-supplied and its accounting definition needs source review. Capital document presence does not verify documents, lender requirements, fundability or approval. Outputs recommend founder review only and never make offers, submit applications, send communications or grant source permissions.

The new runners use only fixed synthetic fixtures; there is no live input adapter. The shared worker now evaluates six synthetic templates at startup and every storage-monitoring cycle. Eleven generated packages exist in source. The existing pilot supports five bounded operational roles: the three public website roles, recovery audit and Command Orchestrator. Synthetic evaluations are not additional live business agents.

Validate with `node --test tests/divisionDecisionAgents.test.mjs tests/factorySpecialists.test.mjs agent-packages/*/agent.test.mjs`. To inspect a fixture use `node agent-packages/realty-economics-pilot/run.mjs` or the equivalent package runner. Generation refuses to replace checked-in packages.

Business-data activation still requires recurring independently retained backups and reviewed source mapping, scope and provenance. Paid model calls remain disabled by the existing zero-dollar execution policy. Recurring independently retained recovery remains a separate activation gate.
