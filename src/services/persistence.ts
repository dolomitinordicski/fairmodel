import { initializeApp } from 'firebase/app';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import type { Region } from '../types/fair';
import { DEFAULT_REGIONS, FIRESTORE_COLLECTION, FIRESTORE_DOC, STORAGE_KEY } from '../features/fair/constants';

type FirebaseConfig = Record<string, string>;
declare global { interface Window { FIREBASE_CONFIG?: FirebaseConfig } }

export type PersistSnapshot = { regions: Region[]; updatedAt: number };

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
  const cfg = window.FIREBASE_CONFIG;
  if (!cfg?.projectId || !cfg?.apiKey) return { mode: 'local' as const, regions: local?.regions ?? DEFAULT_REGIONS, updatedAt: local?.updatedAt ?? Date.now() };
  const db = getFirestore(initializeApp(cfg));
  const ref = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
  const snap = await getDoc(ref);
  const cloud = snap.exists() ? snap.data() : null;
  const cloudRegions = cloud?.regions;
  const cloudTs = Number(cloud?.clientUpdatedAt || 0);
  const localTs = Number(local?.updatedAt || 0);
  let regions = local?.regions ?? DEFAULT_REGIONS;
  let ts = localTs || Date.now();
  if (validRegions(cloudRegions) && cloudTs > localTs) {
    regions = cloudRegions;
    ts = cloudTs || Date.now();
    saveLocal(regions, ts);
  } else {
    await setDoc(ref, { regions, version: 2, clientUpdatedAt: ts, updatedAt: serverTimestamp() }, { merge: true });
  }
  return { mode: 'firebase' as const, db, ref, regions, updatedAt: ts };
}

export async function saveCloud(db: ReturnType<typeof getFirestore>, ref: ReturnType<typeof doc>, regions: Region[], updatedAt = Date.now()) {
  saveLocal(regions, updatedAt);
  await setDoc(ref, { regions, version: 2, clientUpdatedAt: updatedAt, updatedAt: serverTimestamp() }, { merge: true });
  return updatedAt;
}