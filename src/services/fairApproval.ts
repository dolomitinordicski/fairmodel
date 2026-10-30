import { getApps, initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, getFirestore, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

const coreConfig = {
  apiKey: 'AIzaSyAgxv6Z45-AfrusbFnCSyvYChRUBu6-vXc',
  authDomain: 'dns-core.firebaseapp.com',
  projectId: 'dns-core',
  appId: '1:387653285986:web:27ad6f2e9a41ea1aebb93b',
};
const coreApp = getApps().find(a => a.name === 'fair-approval-identity') ??
  initializeApp(coreConfig, 'fair-approval-identity');
const coreDb = getFirestore(coreApp);
const auth = getAuth(coreApp);
const fairApp = getApps().find(a => a.name === '[DEFAULT]') ?? initializeApp(firebaseConfig);
const fairDb = getFirestore(fairApp);
const approvalRef = doc(fairDb, 'fairModel', 'ws-2026-27');

export type FairApproval = { approvedAt: Date; approvedBy: string; assemblyDate: string };
export function subscribeFairApproval(callback: (value: FairApproval | null) => void, failed: () => void) {
  return onSnapshot(approvalRef, snap => {
    const a = snap.data()?.approval;
    callback(a?.status === 'approved' && a.approvedAt?.toDate
      ? { approvedAt: a.approvedAt.toDate(), approvedBy: a.approvedBy ?? '', assemblyDate: a.assemblyDate ?? '' }
      : null);
  }, failed);
}
export function subscribeFairAdmin(callback: (isAdmin: boolean) => void) {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) { callback(false); return; }
    try {
      const p = await getDoc(doc(coreDb,'users',user.uid));
      callback(p.exists() && p.data().active === true &&
        Array.isArray(p.data().globalRoles) && p.data().globalRoles.includes('dns-admin'));
    } catch { callback(false); }
  });
}
export async function approveFair(assemblyDate: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('DNS_ADMIN_LOGIN_REQUIRED');
  const p = await getDoc(doc(coreDb, 'users', user.uid));
  if (!p.exists() || p.data().active !== true || !p.data().globalRoles?.includes('dns-admin')) {
    throw new Error('DNS_ADMIN_REQUIRED');
  }
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(assemblyDate)) throw new Error('INVALID_ASSEMBLY_DATE');
  await runTransaction(fairDb, async tx => {
    const current = await tx.get(approvalRef);
    if (!current.exists()) throw new Error('FAIR_NOT_PERSISTED');
    if (current.data()?.approval?.status === 'approved') throw new Error('ALREADY_APPROVED');
    tx.update(approvalRef, { approval: {
      status: 'approved', assemblyDate, approvedBy: user.uid, approvedAt: serverTimestamp(),
    }});
  });
}
