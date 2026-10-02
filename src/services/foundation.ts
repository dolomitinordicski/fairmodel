import {
  initDNSFoundation,
  type DNSFoundationRuntimeHandle,
} from '@dolomitinordicski/dns-shared-data/foundation';
import { DNS_FOUNDATION_RELEASE_VERSION } from '@dolomitinordicski/dns-shared-data/release';

type Language = 'de' | 'it';

const foundationAssets =
  `https://raw.githubusercontent.com/dolomitinordicski/dns-shared-data/foundation-v${DNS_FOUNDATION_RELEASE_VERSION}/brand`;

export const DNS_FAIR_FOUNDATION_VERSION = DNS_FOUNDATION_RELEASE_VERSION;
export const DNS_SHARED_WEB_LOGO_URL = `${foundationAssets}/logo-web.png`;
export const DNS_SHARED_PRINT_LOGO_URL = `${foundationAssets}/logo.png`;

let foundation: DNSFoundationRuntimeHandle | null = null;

export function initDNSFairFoundation(language?: Language) {
  if (!foundation) {
    foundation = initDNSFoundation({
      language,
      shellProfile: 'operational',
      capabilities: ['print'],
      accessibility: {
        enabled: true,
        mountSelector: '[data-dns-accessibility-mount]',
        storageKey: 'dns-accessibility-v1',
      },
    });
  } else if (language && foundation.getLanguage() !== language) {
    foundation.setLanguage(language);
  }

  return foundation;
}

export function getDNSFairLanguage(): Language {
  return initDNSFairFoundation().getLanguage();
}

export function setDNSFairLanguage(language: Language) {
  initDNSFairFoundation().setLanguage(language);
}

export function subscribeDNSFairLanguage(listener: (language: Language) => void) {
  return initDNSFairFoundation().subscribeLanguage(listener);
}

export const dnsFairCapabilities = {
  run<T = unknown>(capability: 'print', input?: unknown) {
    return initDNSFairFoundation().capabilityRuntime.run<T>(capability, input);
  },
};
