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


## Foundation v1.13 architecture audit

FAIR is aligned to the canonical DNS architecture:

- Design System / Foundation v1.13.0 package pin;
- shared navigation runtime;
- shared Accessibility v1 runtime;
- shared motion and interaction runtimes;
- shared print runtime and `DNS_DESIGN_SYSTEM.print` tokens;
- body-level `.dns-print-sheet` portal;
- canonical regional-logo manifest and reporting-area aliases;
- FAIR Data Contract metadata;
- Tailwind CSS v4 through the Vite plugin, matching the current DNS application pattern.

Legacy implementation removed during the v1.13 cleanup:

- `backup.html` vanilla-JS FAIR application;
- `firebase-config.js`;
- local `logo.png` and `logo1.png`;
- Tailwind v3 `tailwind.config.js`;
- PostCSS/autoprefixer configuration;
- popup/`document.write` printing;
- local print CSS and page geometry;
- local sticky/progress/navigation behavior.

The FAIR calculation engine and its parity tests remain isolated from the Foundation layer.
