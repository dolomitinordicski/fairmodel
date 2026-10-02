import { useEffect, useMemo, useState } from 'react';
import {
  findRegionLogosForEntity,
  regionLogoPath,
  resolveOrganizationId,
  resolveReportingAreaId,
  type DNSBrandEntityType,
  type DNSRegionLogoAsset,
} from '@dolomitinordicski/dns-shared-data';
import { DNS_FOUNDATION_RELEASE_VERSION } from '@dolomitinordicski/dns-shared-data/release';

type Manifest = {
  assets?: DNSRegionLogoAsset[];
};

const FOUNDATION_ASSET_BASE =
  `https://raw.githubusercontent.com/dolomitinordicski/dns-shared-data/foundation-v${DNS_FOUNDATION_RELEASE_VERSION}`;
const MANIFEST_URL = `${FOUNDATION_ASSET_BASE}/brand/regions/manifest.json`;

let manifestPromise: Promise<DNSRegionLogoAsset[]> | null = null;

function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL, { cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Region logo manifest HTTP ${response.status}`);
        return response.json() as Promise<Manifest>;
      })
      .then((manifest) => Array.isArray(manifest.assets) ? manifest.assets : [])
      .catch((error) => {
        console.warn('Shared DNS region-logo manifest unavailable', error);
        return [];
      });
  }
  return manifestPromise;
}

export function EntityLogos({
  entityType,
  entityId,
  compact = false,
  print = false,
}: {
  entityType: DNSBrandEntityType;
  entityId: string;
  compact?: boolean;
  print?: boolean;
}) {
  const [assets, setAssets] = useState<DNSRegionLogoAsset[]>([]);

  useEffect(() => {
    let active = true;
    void loadManifest().then((next) => {
      if (active) setAssets(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const logos = useMemo(
    () => findRegionLogosForEntity(assets, entityType, entityId),
    [assets, entityType, entityId],
  );

  if (!logos.length) return null;

  return (
    <span className={compact ? 'dns-region-logos is-compact' : 'dns-region-logos'}>
      {logos.map((asset) => (
        <img
          key={asset.id}
          className={print ? 'dns-print-region-logo' : 'dns-region-logo'}
          src={`${FOUNDATION_ASSET_BASE}/${regionLogoPath(asset)}`}
          alt={asset.label}
          loading="lazy"
        />
      ))}
    </span>
  );
}

export function RegionLogos({
  fairName,
  compact = false,
  print = false,
}: {
  fairName: string;
  compact?: boolean;
  print?: boolean;
}) {
  const reportingAreaId = resolveReportingAreaId(fairName);
  if (!reportingAreaId) return null;
  return <EntityLogos entityType="reportingArea" entityId={reportingAreaId} compact={compact} print={print} />;
}

export function RegionLabel({
  fairName,
  compact = false,
  print = false,
}: {
  fairName: string;
  compact?: boolean;
  print?: boolean;
}) {
  return (
    <span className="dns-region-label">
      <RegionLogos fairName={fairName} compact={compact} print={print} />
      <span>{fairName}</span>
    </span>
  );
}

export function OrganizationLabel({
  organizationName,
  compact = false,
  print = false,
}: {
  organizationName: string;
  compact?: boolean;
  print?: boolean;
}) {
  const organizationId = resolveOrganizationId(organizationName);

  return (
    <span className="dns-region-label">
      {organizationId ? (
        <EntityLogos entityType="organization" entityId={organizationId} compact={compact} print={print} />
      ) : null}
      <span>{organizationName}</span>
    </span>
  );
}
