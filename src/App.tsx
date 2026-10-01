import { useEffect, useMemo, useRef, useState } from 'react';
import type { Language, Region, SaveMode } from './types/fair';
import { translations } from './i18n/translations';
import { calculateFairDistribution } from './features/fair/calculations';
import { DEFAULT_REGIONS, FF, N, ORGANISATIONS, PREV } from './features/fair/constants';
import { fmt2, fmtE, fmtInputInt, parseFormattedInt } from './utils/formatting';
import { connectPersistence, loadLocal, saveCloud, saveLocal } from './services/persistence';
import { AccessibilityMount } from './components/AccessibilityMount';
import { NavigationRuntimeMount } from './components/NavigationRuntimeMount';
import { OrganizationLabel, RegionLabel } from './components/RegionLogos';
import { FairPrintSheet, type FairPrintMode } from './components/FairPrintSheet';
import {
  applyDNSFoundation,
  DNS_FAIR_FOUNDATION_VERSION,
  DNS_SHARED_WEB_LOGO_URL,
  printDNSDocument,
} from './services/foundation';
import {
  DNS_DATA_CONTRACTS,
  DNS_DATA_CONTRACTS_VERSION,
} from '@dolomitinordicski/dns-shared-data/data-contracts';

const SectionTitle=({children}:{children:React.ReactNode})=><h2 className="font-display text-[11px] font-bold text-dns-deep uppercase tracking-[.07em] mt-4 md:mt-5 mb-2">{children}</h2>;
const Kpi=({label,value,sub}:{label:string;value:string;sub?:string})=><div className="bg-white rounded-[10px] border-t-[3px] border-t-dns-light p-3 md:px-4 md:py-3 shadow-[0_1px_4px_rgba(13,77,94,.07)]"><div className="font-display text-[10px] font-bold uppercase tracking-[.07em] text-dns-mid mb-1">{label}</div><div className="font-display text-[20px] md:text-[21px] leading-none font-bold text-dns-deep">{value}</div>{sub&&<div className="font-alt text-[10px] text-dns-muted mt-1">{sub}</div>}</div>;

function FormattedIntInput({value,onCommit}:{value:number;onCommit:(value:number)=>void}){
  const [text,setText]=useState(()=>fmtInputInt(value));
  useEffect(()=>setText(fmtInputInt(value)),[value]);
  return <input className="dns-input" inputMode="numeric" value={text}
    onFocus={e=>e.currentTarget.select()}
    onChange={e=>setText(e.target.value)}
    onBlur={()=>{const next=parseFormattedInt(text);setText(fmtInputInt(next));onCommit(next);}} />;
}

export default function App(){
  const [language,setLanguage]=useState<Language>('de');
  const [regions,setRegions]=useState<Region[]>(()=>loadLocal()?.regions ?? DEFAULT_REGIONS.map(r=>({...r})));
  const [saveMode,setSaveMode]=useState<SaveMode>('waiting');
  const [saveAt,setSaveAt]=useState<number|null>(null);
  const [printMode,setPrintMode]=useState<FairPrintMode>('overview');
  const persistence=useRef<any>(null);
  const hydrated=useRef(false);
  const t=translations[language];
  const results=useMemo(()=>calculateFairDistribution(regions),[regions]);
  const fairContract=DNS_DATA_CONTRACTS.find(contract=>contract.id==='fair');

  useEffect(()=>applyDNSFoundation(),[]);


  useEffect(()=>{(async()=>{try{
    const state=await connectPersistence(loadLocal());
    persistence.current=state;
    setRegions(state.regions.map(r=>({...r})));
    setSaveAt(state.updatedAt);
    setSaveMode(state.mode==='firebase'?'cloud':'local');
  }catch(e){console.warn(e);setSaveMode('error');}finally{hydrated.current=true;}})();},[]);

  useEffect(()=>{if(!hydrated.current)return; const id=window.setTimeout(async()=>{const now=Date.now();try{
    saveLocal(regions,now);
    if(persistence.current?.mode==='firebase'){setSaveMode('waiting');await saveCloud(persistence.current.db,persistence.current.ref,regions,now);setSaveMode('cloud');}
    else setSaveMode('local');
    setSaveAt(now);
  }catch(e){console.warn(e);setSaveMode('error');setSaveAt(now);}},350);return()=>window.clearTimeout(id);},[regions]);

  const stamp=saveAt?new Date(saveAt).toLocaleTimeString(language==='de'?'de-DE':'it-IT',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'';
  const statusText=(saveMode==='cloud'?t.cloud:saveMode==='waiting'?t.waiting:saveMode==='error'?t.error:t.local)+(stamp?' · '+stamp:'');
  const statusDot=saveMode==='cloud'?'bg-dns-positive':saveMode==='waiting'?'bg-dns-mid':saveMode==='error'?'bg-dns-negative':'bg-dns-light';

  function updateRegion(index:number,key:keyof Pick<Region,'PN'|'SW'|'KP'|'SA'>,value:number){setRegions(prev=>prev.map((r,i)=>i===index?{...r,[key]:value}:r));}
  function reset(){setRegions(DEFAULT_REGIONS.map(r=>({...r})));}

  const totalPN=regions.reduce((s,r)=>s+r.PN,0), totalSW=regions.reduce((s,r)=>s+r.SW,0), totalSA=regions.reduce((s,r)=>s+r.SA,0);
  const totalScore=results.reduce((s,r)=>s+r.score,0), totalVF=results.reduce((s,r)=>s+r.varFee,0);
  const maxR=results.reduce((a,b)=>b.varFee>a.varFee?b:a,results[0]);
  const totalAll=results.reduce((s,r)=>s+r.varFee+FF,0), totalPrev=PREV.reduce((s,v)=>s+v,0);
  const orgTotals=ORGANISATIONS.reduce((acc,g)=>{const area=results.find(r=>r.name===g.reg);g.list.forEach(o=>{const vf=(area?.varFee||0)*o[1];acc.vf+=vf;acc.ff+=o[2];acc.total+=vf+o[2];});return acc;},{vf:0,ff:0,total:0});

  function requestPrint(mode: FairPrintMode) {
    setPrintMode(mode);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => printDNSDocument());
    });
  }

  return <div className="min-h-screen flex flex-col">
    <header id="dns-fair-header" className="sticky top-0 z-50 bg-dns-deep text-white px-4 py-3.5 md:px-[1.8rem] flex items-center justify-between gap-4 shadow-[0_1px_0_rgba(255,255,255,.08)]">
      <div className="flex items-center gap-[18px] min-w-0">
        <img src={DNS_SHARED_WEB_LOGO_URL} alt="Dolomiti NordicSki" className="h-10 w-auto block"/>
        <div className="min-w-0">
          <div className="font-display uppercase text-[21px] md:text-[23px] leading-none tracking-[.035em] text-white whitespace-nowrap"><span className="font-bold">DNS</span><span className="font-normal ml-2">FAIR</span></div>
          <div className="font-alt text-[12px] md:text-[13px] font-normal uppercase tracking-[.035em] text-dns-light mt-1 leading-tight truncate">{t.subtitle}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 whitespace-nowrap">
        <AccessibilityMount language={language}/>
        <div>{(['de','it'] as Language[]).map(l=><button key={l} onClick={()=>setLanguage(l)} data-dns-press className={'ml-1 border-0 border-b-2 bg-transparent px-1 py-1 text-[10px] font-display font-semibold tracking-[.05em] text-white '+(language===l?'border-white':'border-transparent opacity-60')}>{l.toUpperCase()}</button>)}</div>
      </div>
    </header>

    <nav id="dns-fair-nav" className="dns-tab-nav" aria-label="FAIR">
      <div id="dns-scroll-progress" className="dns-scroll-progress-track" role="progressbar" aria-label="Page scroll progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
        <span id="dns-scroll-progress-bar" className="dns-scroll-progress-bar"/>
      </div>
      <div className="dns-tab-nav-inner">
        <div className="dns-tab-season-wrap"><span className="dns-tab-season">FAIR · WS 2026/27</span></div>
        {[
          ['fair-parameters',t.parameters],
          ['fair-input',t.input],
          ['fair-result',t.result],
          ['fair-distribution',t.distribution],
          ['fair-annual',t.annual],
          ['fair-organisations',t.orgs],
        ].map(([id,label])=><a key={id} href={'#'+id} data-section={id} className="dns-tab">{label}</a>)}
      </div>
    </nav>
    <NavigationRuntimeMount />
    <main className="flex-1 p-3 md:px-6 md:py-4 max-w-[1100px] w-full mx-auto">
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <button className="dns-btn-primary" onClick={()=>requestPrint('overview')}>⬇ {t.print}</button>
        <button className="dns-btn-primary bg-dns-mid" onClick={()=>requestPrint('final')}>⬇ {t.printFinal}</button>
        <button className="dns-btn-primary bg-dns-mid" onClick={()=>requestPrint('organisations')}>⬇ {t.printOrg}</button>
        <button className="dns-btn-secondary" onClick={reset}>↺ {t.reset}</button>
        <div className="md:ml-auto flex items-center gap-1.5 text-[10px] text-dns-muted px-2 py-1 border border-dns-border rounded bg-white"><span className={'w-[7px] h-[7px] rounded-full '+statusDot}/>{statusText}</div>
      </div>

      <section id="fair-parameters" className="dns-fair-section" data-dns-reveal>
      <SectionTitle>{t.parameters}</SectionTitle>
      <div className="grid grid-cols-1 min-[421px]:grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        {[[ 'PN',t.pn,'15%',t.direct],['SWDNS',t.sw,'55%',t.direct],['KP',t.kp,'20%',t.premium],['SA',t.sa,'10%',t.premium]].map((x,i)=><div key={x[0]} className="bg-white rounded-[10px] border-t-[3px] border-t-dns-light p-3 text-center shadow-[0_1px_4px_rgba(13,77,94,.07)]"><div className="font-display text-[15px] md:text-[17px] font-bold text-dns-deep">{x[0]}</div><div className="font-alt text-[9px] md:text-[10px] text-dns-muted my-1 min-h-[22px]">{x[1]}</div><div className="font-display text-lg md:text-[22px] font-bold text-dns-deep">{x[2]}</div><span className={'inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full '+(i<2?'bg-dns-light/20 text-dns-mid':'bg-dns-bg text-dns-mid')}>{x[3]}</span><div className="font-alt text-[9px] text-dns-muted/70 mt-1">{t.locked}</div></div>)}
      </div>
      <div className="dns-note">{t.note}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-4"><Kpi label={t.variableFee} value="€ 45.000" sub={t.fullDistribution}/><Kpi label={t.activePartners} value={String(results.filter(r=>r.score>0).length)} sub={t.scorePositive}/><Kpi label={t.highestShare} value={fmtE(maxR.varFee)} sub={maxR.name}/></div>
      </section>

      <section id="fair-input" className="dns-fair-section" data-dns-reveal>
      <SectionTitle>{t.input}</SectionTitle>
      <div className="dns-table-wrap"><table className="dns-table"><thead><tr><th>{t.partner}</th><th>PN</th><th>SWDNS</th><th>KP % ★</th><th>SA ★</th></tr></thead><tbody>{regions.map((r,i)=><tr key={r.name}><td><RegionLabel fairName={r.name}/></td><td className="text-right"><FormattedIntInput value={r.PN} onCommit={value=>updateRegion(i,'PN',value)}/></td><td className="text-right"><FormattedIntInput value={r.SW} onCommit={value=>updateRegion(i,'SW',value)}/></td><td className="text-right"><input type="number" className="dns-input" min="0" max="100" value={r.KP} onChange={e=>updateRegion(i,'KP',Number(e.target.value)||0)}/></td><td className="text-right"><input type="number" className="dns-input" min="0" value={r.SA} onChange={e=>updateRegion(i,'SA',Number(e.target.value)||0)}/></td></tr>)}</tbody><tfoot><tr className="bg-dns-bg font-bold text-dns-deep border-t-2 border-dns-light"><td className="px-2.5 py-2">{t.total}</td><td className="text-right px-2.5">{totalPN.toLocaleString('de-DE')}</td><td className="text-right px-2.5">{totalSW.toLocaleString('de-DE')}</td><td className="text-right px-2.5">—</td><td className="text-right px-2.5">{totalSA}</td></tr></tfoot></table></div>
      <div className="dns-note">{t.dataNote}</div>
      </section>

      <section id="fair-result" className="dns-fair-section" data-dns-reveal>
      <SectionTitle>{t.result}</SectionTitle>
      <div className="dns-table-wrap"><table className="dns-table"><thead><tr><th>{t.partner}</th><th>PN w.</th><th>SWDNS w.</th><th>KP w.</th><th>SA w.</th><th>Score %</th><th>Variable Fee</th></tr></thead><tbody>{results.map(r=><tr key={r.name}><td><RegionLabel fairName={r.name}/></td><td className="text-right">{fmt2(r.pnW)}</td><td className="text-right">{fmt2(r.swW)}</td><td className="text-right">{fmt2(r.kpW)}</td><td className="text-right">{fmt2(r.saW)}</td><td className="text-right font-bold text-dns-deep">{fmt2(r.score)} %</td><td className="text-right font-bold text-dns-positive">{fmtE(r.varFee)}</td></tr>)}</tbody><tfoot><tr className="bg-dns-bg font-bold text-dns-deep"><td className="px-2.5 py-2">{t.total}</td><td/><td/><td/><td/><td className="text-right">{fmt2(totalScore)} %</td><td className="text-right">{fmtE(totalVF)}</td></tr></tfoot></table></div>
      </section>

      <section id="fair-distribution" className="dns-fair-section" data-dns-reveal>
      <SectionTitle>{t.distribution}</SectionTitle>
      <div className="bg-white border border-dns-border p-3 mb-4">{results.map(r=><div key={r.name} className="grid grid-cols-[115px_1fr_68px] md:grid-cols-[190px_1fr_75px] gap-2 items-center mb-1.5"><div className="text-[10px] md:text-[11px] md:text-right leading-tight"><RegionLabel fairName={r.name} compact/></div><div className="bg-dns-bg rounded h-[13px] md:h-[15px] overflow-hidden"><div className="h-full bg-gradient-to-r from-dns-mid to-dns-light rounded" style={{width:((r.varFee/maxR.varFee)*100).toFixed(1)+'%'}}/></div><div className="text-right text-[10px] md:text-[11px] font-semibold text-dns-deep">{fmtE(r.varFee)}</div></div>)}</div>
      </section>

      <section id="fair-annual" className="dns-fair-section" data-dns-reveal>
      <SectionTitle>{t.annual}</SectionTitle>
      <div className="dns-table-wrap"><table className="dns-table"><thead><tr><th>{t.partner}</th><th>Score %</th><th>Variable Fee</th><th>Fixed Fee</th><th>Tot. 2027</th><th>Quote 2026</th><th>+/−</th></tr></thead><tbody>{results.map((r,i)=>{const tot=r.varFee+FF,diff=tot-PREV[i];return <tr key={r.name}><td><RegionLabel fairName={r.name}/></td><td className="text-right">{fmt2(r.score)} %</td><td className="text-right font-bold text-dns-positive">{fmtE(r.varFee)}</td><td className="text-right">{fmtE(FF)}</td><td className="text-right font-bold text-dns-deep">{fmtE(tot)}</td><td className="text-right">{fmtE(PREV[i])}</td><td className={'text-right font-bold '+(diff>0?'text-dns-negative':'text-dns-positive')}>{diff>0?'+':''}{fmtE(diff)}</td></tr>;})}</tbody><tfoot><tr className="bg-dns-bg font-bold text-dns-deep border-t-2 border-dns-light"><td className="px-2.5 py-2">{t.total}</td><td className="text-right">{fmt2(totalScore)} %</td><td className="text-right">{fmtE(totalVF)}</td><td className="text-right">{fmtE(FF*N)}</td><td className="text-right">{fmtE(totalAll)}</td><td className="text-right">{fmtE(totalPrev)}</td><td className="text-right">{(totalAll-totalPrev)>0?'+':''}{fmtE(totalAll-totalPrev)}</td></tr></tfoot></table></div>
      <div className="dns-note">{t.vat}</div>
      </section>

      <section id="fair-organisations" className="dns-fair-section" data-dns-reveal>
      <SectionTitle>{t.orgs}</SectionTitle>
      <div className="dns-table-wrap"><table className="dns-table"><thead><tr><th>{t.organisation}</th><th>{t.region}</th><th>{t.key}</th><th>Variable Fee</th><th>Fixed Fee</th><th>Tot. 2027</th></tr></thead><tbody>{ORGANISATIONS.flatMap(g=>{const area=results.find(r=>r.name===g.reg);return g.list.map((o,i)=>{const vf=(area?.varFee||0)*o[1],tot=vf+o[2];return <tr key={g.reg+o[0]}><td><OrganizationLabel organizationName={o[0]}/></td>{i===0?<td rowSpan={g.list.length} className="dns-region-group-cell"><RegionLabel fairName={g.reg}/></td>:null}<td className="text-right">{fmt2(o[1]*100)} %</td><td className="text-right font-bold text-dns-positive">{fmtE(vf)}</td><td className="text-right">{fmtE(o[2])}</td><td className="text-right font-bold text-dns-deep">{fmtE(tot)}</td></tr>;});})}</tbody><tfoot><tr className="bg-dns-bg font-bold text-dns-deep border-t-2 border-dns-light"><td className="px-2.5 py-2">{t.total}</td><td></td><td className="text-right">100,00 %</td><td className="text-right">{fmtE(orgTotals.vf)}</td><td className="text-right">{fmtE(orgTotals.ff)}</td><td className="text-right">{fmtE(orgTotals.total)}</td></tr></tfoot></table></div>
      </section>
    </main>
    <footer className="bg-dns-deep px-4 md:px-[1.8rem] py-3 font-alt"><div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] md:text-[11px] uppercase tracking-[.04em] text-white/65"><span>Dolomiti NordicSki</span><span>DNS FAIR · Foundation v{DNS_FAIR_FOUNDATION_VERSION} · Data Contracts v{DNS_DATA_CONTRACTS_VERSION} · {fairContract?.status ?? 'fair'} · © {new Date().getFullYear()}</span></div></footer>
    <FairPrintSheet mode={printMode} language={language} results={results} />
  </div>;
}
