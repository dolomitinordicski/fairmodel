import { getApps, initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';

const DNS_CORE_APP_NAME = 'dns-core-header-status';
const dnsCoreConfig = {
  apiKey: 'AIzaSyAgxv6Z45-AfrusbFnCSyvYChRUBu6-vXc',
  authDomain: 'dns-core.firebaseapp.com',
  projectId: 'dns-core',
  storageBucket: 'dns-core.firebasestorage.app',
  messagingSenderId: '387653285986',
  appId: '1:387653285986:web:27ad6f2e9a41ea1aebb93b',
  measurementId: 'G-2G56PRYNME',
};

const app =
  getApps().find(existing => existing.name === DNS_CORE_APP_NAME) ??
  initializeApp(dnsCoreConfig, DNS_CORE_APP_NAME);

const db = getFirestore(app);

export type DNSCoreHeaderStatus =
  | { state: 'loading' }
  | { state: 'ready'; reportingAreas: number; organizations: number }
  | { state: 'error' };

export async function probeDNSCoreHeader(): Promise<DNSCoreHeaderStatus> {
  try {
    const [reportingAreas, organizations] = await Promise.all([
      getDocs(collection(db, 'reportingAreas')),
      getDocs(collection(db, 'organizations')),
    ]);
    return {
      state: 'ready',
      reportingAreas: reportingAreas.size,
      organizations: organizations.size,
    };
  } catch {
    return { state: 'error' };
  }
}


export interface DNSAreaAllocationKey {
  id: string;
  seasonId: string;
  reportingAreaId: string;
  allocations: Array<{
    organizationId: string;
    share: number;
    fixedShare: number;
  }>;
  active: boolean;
  revision: number;
}

export async function loadDNSAreaAllocationKeys(seasonId: string): Promise<DNSAreaAllocationKey[]> {
  const snapshot = await getDocs(
    query(collection(db, 'areaAllocationKeys'), where('seasonId', '==', seasonId)),
  );
  return snapshot.docs.flatMap((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    if (
      typeof data.seasonId !== 'string' ||
      typeof data.reportingAreaId !== 'string' ||
      !Array.isArray(data.allocations) ||
      typeof data.active !== 'boolean' ||
      typeof data.revision !== 'number'
    ) return [];
    const allocations = data.allocations.flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
      const row = item as Record<string, unknown>;
      if (
        typeof row.organizationId !== 'string' ||
        typeof row.share !== 'number' ||
        typeof row.fixedShare !== 'number'
      ) return [];
      return [{ organizationId: row.organizationId, share: row.share, fixedShare: row.fixedShare }];
    });
    return allocations.length ? [{
      id: docSnap.id,
      seasonId: data.seasonId,
      reportingAreaId: data.reportingAreaId,
      allocations,
      active: data.active,
      revision: data.revision,
    }] : [];
  });
}
