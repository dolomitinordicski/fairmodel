export const fmt2 = (n: number) => n.toFixed(2).replace('.', ',');

export const fmtE = (n: number) =>
  '€\u202f' + Math.round(n).toLocaleString('de-DE');

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export const fmtInputInt = (n: number) =>
  Math.round(Number(n) || 0).toLocaleString('de-DE');

export function parseFormattedInt(value: string | number): number {
  const normalized = String(value ?? '')
    .replace(/\./g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '');
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}
