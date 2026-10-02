# DNS FAIR

Dolomiti NordicSki FAIR contribution model for WS 2026/27.

## Foundation alignment

FAIR consumes the immutable DNS Foundation release `foundation-v1.2.0` from
`@dolomitinordicski/dns-shared-data`.

Foundation-owned behavior:
- design variables and shared UI primitives;
- operational shell, sticky header/navigation and scroll behavior;
- DE-first language preference and language persistence;
- Accessibility runtime;
- motion and interaction runtimes;
- print runtime;
- footer runtime;
- shared DNS brand assets;
- canonical regional/organization logo helpers and manifest contract;
- FAIR Data Contract metadata.

FAIR-owned behavior:
- FAIR inputs and domain presentation;
- FAIR calculation engine;
- 2026/27 FAIR constants and parity baseline;
- persistence in the existing `fair-modell` Firebase project;
- FAIR-specific printable table contents;
- DNS Core read-only consumption of `areaAllocationKeys`.

## Calculation-engine protection

`src/features/fair/calculations.ts` and its constants are intentionally outside
Foundation governance. UI/Foundation cleanup must not change the calculation
engine.

`src/features/fair/calculations.test.ts` is the parity guard for WS 2026/27 and
must remain green for every refactor.

## Shared assets

Brand and regional assets are resolved against the same immutable Foundation
release tag used by the application dependency. No DNS logo or regional logo
binary is copied into this repository.

## Persistence boundaries

FAIR continues to own its model snapshot in the `fair-modell` project.
DNS Core master data and area allocation keys are consumed read-only. FAIR does
not mutate DNS Core master data.
