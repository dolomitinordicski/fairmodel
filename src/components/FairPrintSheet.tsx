import { createPortal } from 'react-dom';
import type { FairResult, Language } from '../types/fair';
import { FF, N, ORGANISATIONS, PREV } from '../features/fair/constants';
import { fmt2, fmtE } from '../utils/formatting';
import { RegionLabel } from './RegionLogos';
import { DNS_SHARED_PRINT_LOGO_URL } from '../services/foundation';

export type FairPrintMode = 'overview' | 'final' | 'organisations';

interface FairPrintSheetProps {
  mode: FairPrintMode;
  language: Language;
  results: FairResult[];
}

export function FairPrintSheet({ mode, language, results }: FairPrintSheetProps) {
  const date = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const totalScore = results.reduce((sum, row) => sum + row.score, 0);
  const totalVF = results.reduce((sum, row) => sum + row.varFee, 0);
  const totalAll = results.reduce((sum, row) => sum + row.varFee + FF, 0);
  const totalPrev = PREV.reduce((sum, value) => sum + value, 0);

  const title =
    mode === 'organisations'
      ? language === 'de' ? 'Jahresbeitrag 2027 — Organisationen' : 'Quota annuale 2027 — Organizzazioni'
      : mode === 'final'
        ? language === 'de' ? 'Jahresbeitrag 2027 — Partner' : 'Quota annuale 2027 — Partner'
        : language === 'de' ? 'FAIR Modell — Ergebnis' : 'Modello FAIR — Risultato';

  const resultTable = (
    <table className="dns-print-table">
      <thead>
        <tr>
          <th>{language === 'de' ? 'Partner' : 'Partner'}</th>
          <th className="dns-print-number">PN w.</th>
          <th className="dns-print-number">SWDNS w.</th>
          <th className="dns-print-number">KP w.</th>
          <th className="dns-print-number">SA w.</th>
          <th className="dns-print-number">Score %</th>
          <th className="dns-print-number">Variable Fee</th>
        </tr>
      </thead>
      <tbody>
        {results.map((row) => (
          <tr key={row.name}>
            <td><RegionLabel fairName={row.name} print /></td>
            <td className="dns-print-number">{fmt2(row.pnW)}</td>
            <td className="dns-print-number">{fmt2(row.swW)}</td>
            <td className="dns-print-number">{fmt2(row.kpW)}</td>
            <td className="dns-print-number">{fmt2(row.saW)}</td>
            <td className="dns-print-number"><strong>{fmt2(row.score)} %</strong></td>
            <td className="dns-print-number">{fmtE(row.varFee)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td>{language === 'de' ? 'Total' : 'Totale'}</td>
          <td /><td /><td /><td />
          <td className="dns-print-number">{fmt2(totalScore)} %</td>
          <td className="dns-print-number">{fmtE(totalVF)}</td>
        </tr>
      </tfoot>
    </table>
  );

  const finalTable = (
    <table className="dns-print-table">
      <thead>
        <tr>
          <th>{language === 'de' ? 'Partner' : 'Partner'}</th>
          <th className="dns-print-number">Score %</th>
          <th className="dns-print-number">Variable Fee</th>
          <th className="dns-print-number">Fixed Fee</th>
          <th className="dns-print-number">Tot. 2027</th>
          <th className="dns-print-number">Quote 2026</th>
          <th className="dns-print-number">+/−</th>
        </tr>
      </thead>
      <tbody>
        {results.map((row, index) => {
          const total = row.varFee + FF;
          const diff = total - PREV[index];
          return (
            <tr key={row.name}>
              <td><RegionLabel fairName={row.name} print /></td>
              <td className="dns-print-number">{fmt2(row.score)} %</td>
              <td className="dns-print-number">{fmtE(row.varFee)}</td>
              <td className="dns-print-number">{fmtE(FF)}</td>
              <td className="dns-print-number"><strong>{fmtE(total)}</strong></td>
              <td className="dns-print-number">{fmtE(PREV[index])}</td>
              <td className="dns-print-number">{diff > 0 ? '+' : ''}{fmtE(diff)}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td>{language === 'de' ? 'Total' : 'Totale'}</td>
          <td className="dns-print-number">{fmt2(totalScore)} %</td>
          <td className="dns-print-number">{fmtE(totalVF)}</td>
          <td className="dns-print-number">{fmtE(FF * N)}</td>
          <td className="dns-print-number">{fmtE(totalAll)}</td>
          <td className="dns-print-number">{fmtE(totalPrev)}</td>
          <td className="dns-print-number">{totalAll - totalPrev > 0 ? '+' : ''}{fmtE(totalAll - totalPrev)}</td>
        </tr>
      </tfoot>
    </table>
  );

  const organisationRows = ORGANISATIONS.flatMap((group) => {
    const area = results.find((row) => row.name === group.reg);
    return group.list.map((org) => {
      const variableFee = (area?.varFee ?? 0) * org[1];
      return {
        region: group.reg,
        organisation: org[0],
        key: org[1],
        variableFee,
        fixedFee: org[2],
        total: variableFee + org[2],
      };
    });
  });

  const organisationTable = (
    <table className="dns-print-table">
      <thead>
        <tr>
          <th>{language === 'de' ? 'Organisation' : 'Organizzazione'}</th>
          <th>{language === 'de' ? 'Region DNS' : 'Regione DNS'}</th>
          <th className="dns-print-number">{language === 'de' ? 'Schlüssel' : 'Chiave'}</th>
          <th className="dns-print-number">Variable Fee</th>
          <th className="dns-print-number">Fixed Fee</th>
          <th className="dns-print-number">Tot. 2027</th>
        </tr>
      </thead>
      <tbody>
        {organisationRows.map((row) => (
          <tr key={row.region + row.organisation}>
            <td>{row.organisation}</td>
            <td><RegionLabel fairName={row.region} print /></td>
            <td className="dns-print-number">{fmt2(row.key * 100)} %</td>
            <td className="dns-print-number">{fmtE(row.variableFee)}</td>
            <td className="dns-print-number">{fmtE(row.fixedFee)}</td>
            <td className="dns-print-number"><strong>{fmtE(row.total)}</strong></td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td>{language === 'de' ? 'Total' : 'Totale'}</td>
          <td />
          <td className="dns-print-number">100,00 %</td>
          <td className="dns-print-number">{fmtE(organisationRows.reduce((sum, row) => sum + row.variableFee, 0))}</td>
          <td className="dns-print-number">{fmtE(organisationRows.reduce((sum, row) => sum + row.fixedFee, 0))}</td>
          <td className="dns-print-number">{fmtE(organisationRows.reduce((sum, row) => sum + row.total, 0))}</td>
        </tr>
      </tfoot>
    </table>
  );

  return createPortal(
    <section className="dns-print-sheet" aria-hidden="true">
      <header className="dns-print-document-header">
        <img className="dns-print-logo" src={DNS_SHARED_PRINT_LOGO_URL} alt="Dolomiti NordicSki" />
        <div>
          <h1 className="dns-print-title">{title}</h1>
          <div className="dns-print-meta">Dolomiti NordicSki · WS 2026/27 · {date}</div>
        </div>
      </header>

      {mode === 'overview' && resultTable}
      {mode === 'final' && finalTable}
      {mode === 'organisations' && organisationTable}
    </section>,
    document.body,
  );
}
