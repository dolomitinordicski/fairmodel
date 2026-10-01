import { DNS_DESIGN_SYSTEM } from '@dolomitinordicski/dns-shared-data/design-system';
import { initDNSInteractionRuntime } from '@dolomitinordicski/dns-shared-data/ui/interaction';
import { initDNSRevealRuntime } from '@dolomitinordicski/dns-shared-data/ui/motion';
import { initDNSPrintRuntime } from '@dolomitinordicski/dns-shared-data/ui/print';

export const DNS_FAIR_FOUNDATION_VERSION = DNS_DESIGN_SYSTEM.version;

const SHARED_BRAND_BASE =
  'https://dolomitinordicski.github.io/dns-shared-data/brand';

export const DNS_SHARED_WEB_LOGO_URL = `${SHARED_BRAND_BASE}/logo-web.png`;
export const DNS_SHARED_PRINT_LOGO_URL = `${SHARED_BRAND_BASE}/logo.png`;

let printRuntime: ReturnType<typeof initDNSPrintRuntime> | null = null;

export function applyDNSFoundation() {
  const ds = DNS_DESIGN_SYSTEM;
  const root = document.documentElement;

  root.style.setProperty('--color-dns-deep', ds.colors.deep);
  root.style.setProperty('--color-dns-mid', ds.colors.mid);
  root.style.setProperty('--color-dns-light', ds.colors.light);
  root.style.setProperty('--color-dns-bg', ds.colors.background);
  root.style.setProperty('--color-dns-surface', ds.colors.surface);
  root.style.setProperty('--color-dns-muted', ds.colors.mutedText);
  root.style.setProperty('--color-dns-border', ds.colors.border);
  root.style.setProperty('--dns-card-radius', `${ds.shape.cardRadiusPx}px`);
  root.style.setProperty('--dns-control-radius', `${ds.shape.controlRadiusPx}px`);

  const interaction = initDNSInteractionRuntime({
    interaction: ds.interaction,
    motion: ds.motion,
  });
  const reveal = initDNSRevealRuntime({ motion: ds.motion });
  printRuntime = initDNSPrintRuntime({ print: ds.print });

  document.body.dataset.dnsDesignVersion = ds.version;
  document.body.dataset.dnsDesignSource = 'package';

  return () => {
    interaction.disconnect();
    reveal.disconnect();
    printRuntime?.disconnect();
    printRuntime = null;
  };
}

export function printDNSDocument() {
  printRuntime?.printNow();
}
