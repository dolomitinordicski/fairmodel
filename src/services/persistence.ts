import { initializeApp } from 'firebase/app';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc, type DocumentReference, type Firestore } from 'firebase/firestore';
import type { OrganisationGroup, Region } from '../types/fair';
import { DEFAULT_REGIONS, FIRESTORE_COLLECTION, FIRESTORE_DOC, STORAGE_KEY } from '../features/fair/constants';
import { calculateFairDistribution } from '../features/fair/calculations';
import { firebaseConfig } from './firebaseConfig';

export type PersistSnapshot = { regions: Region[]; updatedAt: number };

function fairBilling(regions: Region[], organisations: OrganisationGroup[]) {
  const results = calculateFairDistribution(regions);
  const organizations = organisations.flatMap((group) => {
    const area = results.find((result) => result.name === group.reg);
    return group.list.map(([name, variableShare, fixedFee]) => ({
      sourceLabel: name,
      reportingAreaLabel: group.reg,
      distributionKey: variableShare,
      variableFee: Math.round(((area?.varFee ?? 0) * variableShare) * 100) / 100,
      fixedFee: Math.round(fixedFee * 100) / 100,
      totalAmount:
        Math.round((((area?.varFee ?? 0) * variableShare) + fixedFee) * 100) / 100,
    }));
  });
  return {
    seasonId: '2026-27',
    source: 'DNS FAIR',
    status: 'live',
    organizations,
    totalAmount: Math.round(organizations.reduce((sum, row) => sum + row.totalAmount, 0) * 100) / 100,
  };
}

export function validRegions(data: unknown): data is Region[] {
  return Array.isArray(data) && data.length === DEFAULT_REGIONS.length &&
    data.every((r, i) => r && typeof r === 'object' &&
      (r as Region).name === DEFAULT_REGIONS[i].name &&
      ['PN','SW','KP','SA'].every((k) => Number.isFinite(Number((r as unknown as Record<string, unknown>)[k]))));
}

export function loadLocal(): PersistSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistSnapshot;
    return validRegions(parsed.regions) ? parsed : null;
  } catch { return null; }
}

export function saveLocal(regions: Region[], updatedAt = Date.now()) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ regions, version: 2, updatedAt }));
}

export async function connectPersistence(local: PersistSnapshot | null) {
  try {
    const db = getFirestore(initializeApp(firebaseConfig));
    const ref = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
    const snap = await getDoc(ref);
    const cloud = snap.exists() ? snap.data() : null;
    const cloudTs = Number(cloud?.clientUpdatedAt || 0);
    const localTs = Number(local?.updatedAt || 0);
    const cloudValid = validRegions(cloud?.regions);
    let regions = local?.regions ?? DEFAULT_REGIONS;
    let ts = localTs || Date.now();

    if (cloudValid && cloudTs > localTs) {
      regions = cloud.regions;
      ts = cloudTs || Date.now();
      saveLocal(regions, ts);
    } else if (local && validRegions(local.regions)) {
      await setDoc(ref, { regions, version: 3, clientUpdatedAt: ts, updatedAt: serverTimestamp() }, { merge: true });
    } else if (cloudValid) {
      regions = cloud.regions;
      ts = cloudTs || Date.now();
      saveLocal(regions, ts);
    } else {
      ts = Date.now();
      saveLocal(regions, ts);
      await setDoc(ref, { regions, version: 3, clientUpdatedAt: ts, updatedAt: serverTimestamp() }, { merge: true });
    }
    return { mode: 'firebase' as const, db, ref, regions, updatedAt: ts };
  } catch (error) {
    console.warn('Firebase unavailable; using local storage', error);
    return { mode: 'local' as const, regions: local?.regions ?? DEFAULT_REGIONS, updatedAt: local?.updatedAt ?? Date.now() };
  }
}

export async function saveCloud(db: Firestore, ref: DocumentReference, regions: Region[], organisations: OrganisationGroup[], updatedAt = Date.now()) {
  saveLocal(regions, updatedAt);
  await setDoc(ref, { regions, version: 4, billing: fairBilling(regions, organisations), clientUpdatedAt: updatedAt, updatedAt: serverTimestamp() }, { merge: true });
  return updatedAt;
}