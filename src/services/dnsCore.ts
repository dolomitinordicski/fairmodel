import { getApps, initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

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
