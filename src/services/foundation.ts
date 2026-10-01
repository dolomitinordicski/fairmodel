import { DNS_DESIGN_SYSTEM } from '@dolomitinordicski/dns-shared-data/design-system';
import {
  initDNSInteractionRuntime,
} from '@dolomitinordicski/dns-shared-data/ui/interaction';
import {
  initDNSRevealRuntime,
} from '@dolomitinordicski/dns-shared-data/ui/motion';

export const DNS_FAIR_FOUNDATION_VERSION = DNS_DESIGN_SYSTEM.version;

export const DNS_SHARED_WEB_LOGO_URL =
  'https://raw.githubusercontent.com/dolomitinordicski/dns-shared-data/main/brand/logo-web.png';

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

  document.body.dataset.dnsDesignVersion = ds.version;
  document.body.dataset.dnsDesignSource = 'package';

  return () => {
    interaction.disconnect();
    reveal.disconnect();
  };
}
