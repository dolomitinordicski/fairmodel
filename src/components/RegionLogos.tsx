import { useEffect, useMemo, useState } from 'react';
import { resolveOrganizationId, resolveReportingAreaId } from '@dolomitinordicski/dns-shared-data';

type ManifestAsset = {
  id: string;
  label: string;
  filename: string;
  priority?: 'primary' | 'secondary';
  entityBindings?: Array<{
    entityType: 'reportingArea' | 'destination' | 'organization';
    entityId: string;
  }>;
};

type Manifest = {
  basePath?: string;
  assets?: ManifestAsset[];
};

const MANIFEST_URL =
  'https://dolomitinordicski.github.io/dns-shared-data/brand/regions/manifest.json';
const ASSET_BASE_URL =
  'https://dolomitinordicski.github.io/dns-shared-data/brand/regions';

let manifestPromise: Promise<ManifestAsset[]> | null = null;

function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL, { cache: 'no-cache' })
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

function logoRank(asset: ManifestAsset) {
  return asset.priority === 'primary' ? 0 : asset.priority === 'secondary' ? 2 : 1;
}

export function EntityLogos({
  entityType,
  entityId,
  compact = false,
  print = false,
}: {
  entityType: 'reportingArea' | 'destination' | 'organization';
  entityId: string;
  compact?: boolean;
  print?: boolean;
}) {
  const [assets, setAssets] = useState<ManifestAsset[]>([]);

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
    () =>
      assets
        .filter((asset) =>
          asset.entityBindings?.some(
            (binding) =>
              binding.entityType === entityType &&
              binding.entityId === entityId,
          ),
        )
        .sort((a, b) => logoRank(a) - logoRank(b)),
    [assets, entityType, entityId],
  );

  if (!logos.length) return null;

  return (
    <span className={compact ? 'dns-region-logos is-compact' : 'dns-region-logos'}>
      {logos.map((asset) => (
        <img
          key={asset.id}
          className={print ? 'dns-print-region-logo' : 'dns-region-logo'}
          src={`${ASSET_BASE_URL}/${asset.filename}`}
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
