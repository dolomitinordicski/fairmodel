# DNS FAIR

Dolomiti NordicSki FAIR contribution model.

## Foundation alignment

The application consumes DNS Foundation / Design System v1.12.1 from `@dolomitinordicski/dns-shared-data`.

Shared Foundation behavior:
- canonical sticky navigation runtime;
- measured header/navigation stack;
- scroll progress and active-section tracking;
- Accessibility v1;
- shared interaction and reveal runtimes;
- shared DNS web logo;
- FAIR Data Contract metadata.

Tool-specific behavior remains local:
- FAIR input fields;
- FAIR calculation engine;
- FAIR persistence in the existing `fair-modell` Firebase project;
- FAIR print/report outputs.

## Calculation-engine protection

`src/features/fair/calculations.ts` is intentionally outside the Foundation rollout. The parity tests in `src/features/fair/calculations.test.ts` must remain green for every UI/Foundation migration.


### Shared regional logos

FAIR resolves reporting-area logos from the canonical Shared Data manifest at `dns-shared-data/brand/regions/manifest.json`. No regional logo files are copied into this repository. Legacy FAIR area names are resolved through the canonical reporting-area alias map before matching manifest bindings.
