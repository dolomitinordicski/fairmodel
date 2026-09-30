import type { FairResult, Region } from '../../types/fair';
import { BASE_POOL, BF, DISCOUNT, WEIGHTS } from './constants';

export function calculateFairDistribution(regions: Region[]): FairResult[] {
  const maxPN = Math.max(...regions.map((r) => r.PN)) || 1;
  const maxSW = Math.max(...regions.map((r) => r.SW)) || 1;
  const maxKP = Math.max(...regions.map((r) => r.KP)) || 1;
  const maxSA = Math.max(...regions.map((r) => r.SA)) || 1;

  const rows = regions.map((r) => ({
    pnW: (r.PN / maxPN) * WEIGHTS.PN,
    swW: (r.SW / maxSW) * WEIGHTS.SW,
    kpW: r.KP > 0 ? (100 / r.KP) / maxKP * WEIGHTS.KP : 0,
    saW: r.SA > 0 ? (1 / r.SA) / maxSA * WEIGHTS.SA : 0,
    kpD: (r.KP / maxKP) * WEIGHTS.KP,
    saD: (r.SA / maxSA) * WEIGHTS.SA,
  }));

  const totalBase = rows.reduce((sum, r) => sum + r.pnW + r.swW, 0) || 1;
  const totalKPSA = rows.reduce((sum, r) => sum + r.kpD + r.saD, 0) || 1;

  return rows.map((r, index) => ({
    name: regions[index].name,
    pnW: r.pnW,
    swW: r.swW,
    kpW: r.kpW,
    saW: r.saW,
    score: ((r.pnW + r.swW) / totalBase) * 100,
    varFee:
      BF +
      ((r.pnW + r.swW) / totalBase) * BASE_POOL +
      ((r.kpD + r.saD) / totalKPSA) * DISCOUNT,
  }));
}
