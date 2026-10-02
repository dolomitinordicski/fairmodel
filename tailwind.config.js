import { DNS_DESIGN_SYSTEM } from '@dolomitinordicski/dns-shared-data/design-system';

export default {
  theme: {
    extend: {
      colors: {
        'dns-deep': 'var(--color-dns-deep)',
        'dns-mid': 'var(--color-dns-mid)',
        'dns-light': 'var(--color-dns-light)',
        'dns-bg': 'var(--color-dns-bg)',
        'dns-surface': 'var(--color-dns-surface)',
        'dns-muted': 'var(--color-dns-muted)',
        'dns-border': 'var(--color-dns-border)',
        'dns-positive': DNS_DESIGN_SYSTEM.colors.positive,
        'dns-negative': DNS_DESIGN_SYSTEM.colors.negative,
      },
      fontFamily: {
        display: 'var(--font-display)',
        alt: 'var(--font-alt)',
      },
    },
  },
};
