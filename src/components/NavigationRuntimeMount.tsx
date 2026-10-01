import { useLayoutEffect } from 'react';
import {
  DNS_DESIGN_SYSTEM,
} from '@dolomitinordicski/dns-shared-data/design-system';
import { initDNSNavigationRuntime } from '@dolomitinordicski/dns-shared-data/ui/navigation';

export function NavigationRuntimeMount() {
  useLayoutEffect(() => {
    const header = document.getElementById('dns-fair-header');
    const nav = document.getElementById('dns-fair-nav');
    if (!(header instanceof HTMLElement) || !(nav instanceof HTMLElement)) return;

    const tabs = Array.from(document.querySelectorAll<HTMLElement>('.dns-tab[data-section]'));
    const sections = tabs
      .map((tab) => document.getElementById(tab.dataset.section ?? ''))
      .filter((section): section is HTMLElement => section instanceof HTMLElement);

    const runtime = initDNSNavigationRuntime({
      header,
      nav,
      progressTrack: document.getElementById('dns-scroll-progress'),
      progressBar: document.getElementById('dns-scroll-progress-bar'),
      sectionTabs: tabs,
      sectionElements: sections,
      navigation: DNS_DESIGN_SYSTEM.navigation,
      responsive: DNS_DESIGN_SYSTEM.responsive,
    });

    return () => runtime.disconnect();
  }, []);

  return null;
}
