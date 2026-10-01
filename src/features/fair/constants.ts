import type { Region } from '../../types/fair';

export const VF = 45000;
export const FF = 7500;
export const BF = 1500;
export const N = 8;
export const POOL = VF - N * BF;
export const DISCOUNT = POOL * 0.10;
export const BASE_POOL = POOL - DISCOUNT;
export const WEIGHTS = { PN: 15, SW: 55, KP: 20, SA: 10 } as const;

export const PREV = [12344, 21447, 11261, 9185, 13162, 12383, 11291, 13925];

export const DEFAULT_REGIONS: Region[] = [
  { name: 'Osttirol', PN: 835393, SW: 691, KP: 24, SA: 11 },
  { name: '3 Zinnen Dolomites', PN: 936617, SW: 2971, KP: 27, SA: 51 },
  { name: "Cortina d'Ampezzo", PN: 77161, SW: 60, KP: 0, SA: 5 },
  { name: 'Comelico', PN: 7564, SW: 108, KP: 29, SA: 5 },
  { name: 'Gsiesertal / Welsberg / Taisten', PN: 193071, SW: 944, KP: 85, SA: 11 },
  { name: 'Antholzertal', PN: 182878, SW: 722, KP: 79, SA: 9 },
  { name: 'Ahrntal / Sand in Taufers', PN: 692590, SW: 230, KP: 9, SA: 10 },
  { name: 'Seiser Alm / Val Gardena', PN: 2410724, SW: 35, KP: 3, SA: 9 },
];

export const STORAGE_KEY = 'dns-fairmodel-ws-2026-27';
export const FIRESTORE_COLLECTION = 'fairModel';
export const FIRESTORE_DOC = 'ws-2026-27';
