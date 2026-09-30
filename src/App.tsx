import logoUrl from '../logo1.png';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Language, Region, SaveMode } from './types/fair';
import { translations } from './i18n/translations';
import { calculateFairDistribution } from './features/fair/calculations';
import { DEFAULT_REGIONS, FF, N, ORGANISATIONS, PREV, VF } from './features/fair/constants';
import { fmt2, fmtE, fmtInputInt, parseFormattedInt } from './utils/formatting';
import { connectPersistence, loadLocal, saveCloud, saveLocal } from './services/persistence';

const SectionTitle=({children}:{children:React.ReactNode})=><h2 className="font-display text-[11px] font-bold text-dns-deep uppercase tracking-[.07em] mt-4 md:mt-5 mb-2">{children}</h2>;
const Kpi=({label,value,sub}:{label:string;value:string;sub?:string})=><div className="bg-white rounded-[10px] border-t-[3px] border-t-dns-light p-3 md:px-4 md:py-3 shadow-[0_1px_4px_rgba(13,77,94,.07)]"><div className="font-display text-[10px] font-bold uppercase tracking-[.07em] text-dns-mid mb-1">{label}</div><div className="font-display text-[20px] md:text-[21px] leading-none font-bold text-dns-deep">{value}</div>{sub&&<div className="font-alt text-[10px] text-[#8a9da3] mt-1">{sub}</div>}</div>;

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
  const persistence=useRef<any>(null);
  const hydrated=useRef(false);
  const t=translations[language];
  const results=useMemo(()=>calculateFairDistribution(regions),[regions]);

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
  const statusDot=saveMode==='cloud'?'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,.75)]':saveMode==='waiting'?'bg-amber-600':saveMode==='error'?'bg-orange-700':'bg-dns-light';

  function updateRegion(index:number,key:keyof Pick<Region,'PN'|'SW'|'KP'|'SA'>,value:number){setRegions(prev=>prev.map((r,i)=>i===index?{...r,[key]:value}:r));}
  function reset(){setRegions(DEFAULT_REGIONS.map(r=>({...r})));}

  const totalPN=regions.reduce((s,r)=>s+r.PN,0), totalSW=regions.reduce((s,r)=>s+r.SW,0), totalSA=regions.reduce((s,r)=>s+r.SA,0);
  const totalScore=results.reduce((s,r)=>s+r.score,0), totalVF=results.reduce((s,r)=>s+r.varFee,0);
  const maxR=results.reduce((a,b)=>b.varFee>a.varFee?b:a,results[0]);
  const totalAll=results.reduce((s,r)=>s+r.varFee+FF,0), totalPrev=PREV.reduce((s,v)=>s+v,0);
  const orgTotals=ORGANISATIONS.reduce((acc,g)=>{const area=results.find(r=>r.name===g.reg);g.list.forEach(o=>{const vf=(area?.varFee||0)*o[1];acc.vf+=vf;acc.ff+=o[2];acc.total+=vf+o[2];});return acc;},{vf:0,ff:0,total:0});

  function printSimple(kind:'final'|'org'){
    const date=new Date().toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
    let title='',head='',body='',foot='';
    if(kind==='final'){
      title=language==='de'?'Jahresbeitrag 2027 — Partner':'Quota annuale 2027 — Partner';
      head='<tr><th>'+t.partner+'</th><th>Score %</th><th>Variable Fee</th><th>Fixed Fee</th><th>Tot. 2027</th><th>Quote 2026</th><th>+/-</th></tr>';
      body=results.map((r,i)=>{const tot=r.varFee+FF,diff=tot-PREV[i];return '<tr><td>'+r.name+'</td><td>'+fmt2(r.score)+' %</td><td>'+fmtE(r.varFee)+'</td><td>'+fmtE(FF)+'</td><td><strong>'+fmtE(tot)+'</strong></td><td>'+fmtE(PREV[i])+'</td><td>'+(diff>0?'+':'')+fmtE(diff)+'</td></tr>';}).join('');
      foot='<tr><td>'+t.total+'</td><td>100,00 %</td><td>'+fmtE(totalVF)+'</td><td>'+fmtE(FF*N)+'</td><td>'+fmtE(totalAll)+'</td><td>'+fmtE(totalPrev)+'</td><td>'+((totalAll-totalPrev)>0?'+':'')+fmtE(totalAll-totalPrev)+'</td></tr>';
    }else{
      title=language==='de'?'Jahresbeitrag 2027 — Organisationen':'Quota annuale 2027 — Organizzazioni';
      head='<tr><th>'+t.organisation+'</th><th>'+t.region+'</th><th>'+t.key+'</th><th>Variable Fee</th><th>Fixed Fee</th><th>Tot. 2027</th></tr>';
      let sv=0,sf=0,st=0; body=ORGANISATIONS.flatMap(g=>{const area=results.find(r=>r.name===g.reg);return g.list.map((o,i)=>{const vf=(area?.varFee||0)*o[1],ff=o[2],tot=vf+ff;sv+=vf;sf+=ff;st+=tot;return '<tr><td>'+o[0]+'</td><td>'+(i===0?g.reg:'')+'</td><td>'+fmt2(o[1]*100)+' %</td><td>'+fmtE(vf)+'</td><td>'+fmtE(ff)+'</td><td><strong>'+fmtE(tot)+'</strong></td></tr>';});}).join('');
      foot='<tr><td>'+t.total+'</td><td></td><td>100,00 %</td><td>'+fmtE(sv)+'</td><td>'+fmtE(sf)+'</td><td>'+fmtE(st)+'</td></tr>';
    }
    const w=window.open('','_blank'); if(!w)return;
    w.document.write("<!doctype html><html><head><meta charset='utf-8'><title>"+title+"</title><style>body{font-family:Segoe UI,Arial,sans-serif;margin:32px;color:#1a2e33}h2{color:#0D4D5E;font-size:18px;margin-bottom:4px}.sub{font-size:11px;color:#5a7a82;margin-bottom:20px}table{width:100%;border-collapse:collapse}thead{background:#0D4D5E;color:white}th,td{padding:9px 10px;border-bottom:1px solid #d0e4e5;font-size:11px;text-align:right}th:first-child,td:first-child{text-align:left}tbody tr:nth-child(even){background:#e8f4f4}tfoot{background:#E0F0F0;font-weight:700;color:#0D4D5E}@page{size:landscape;margin:14mm}</style></head><body><img src='"+location.origin+import.meta.env.BASE_URL+"logo.png' style='height:34px;margin-bottom:12px'><h2>"+title+"</h2><div class='sub'>Dolomiti NordicSki · WS 2026/27 · "+date+"</div><table><thead>"+head+"</thead><tbody>"+body+"</tbody><tfoot>"+foot+"</tfoot></table></body></html>");
    w.document.close();
    const printNow=()=>window.setTimeout(()=>w.print(),100);
    const img=w.document.querySelector('img');
    if(img && !img.complete){img.addEventListener('load',printNow,{once:true});img.addEventListener('error',printNow,{once:true});}
    else printNow();
  }

  return <div className="min-h-screen flex flex-col">
    <header className="sticky top-0 z-50 bg-dns-deep text-white px-4 py-3 md:px-[1.8rem] md:py-[1.1rem] flex items-center justify-between gap-4 shadow-[0_1px_0_rgba(255,255,255,.08)]">
      <div className="flex items-center gap-[18px] min-w-0"><img src={logoUrl} alt="Dolomiti NordicSki" className="h-10 w-auto block"/><div><div className="font-display text-[16px] font-bold text-white leading-tight">{t.title}</div><div className="font-alt text-[12px] font-light text-dns-light mt-0.5 leading-tight">{t.subtitle}</div></div></div>
      <div className="print-hide flex items-center gap-2 md:gap-3 whitespace-nowrap"><span className="hidden sm:inline-flex rounded-full bg-dns-mid px-3.5 py-1 text-[11px] font-display font-semibold tracking-[.06em] text-white">WS · SI 2026/27</span><div>{(['de','it'] as Language[]).map(l=><button key={l} onClick={()=>setLanguage(l)} className={'ml-1 rounded-full px-2.5 py-1 text-[10px] font-display font-semibold tracking-[.05em] '+(language===l?'bg-white text-dns-deep':'bg-white/10 text-white/75 hover:bg-white/15')}>{l.toUpperCase()}</button>)}</div></div>
    </header>
    <main className="print-main flex-1 p-3 md:px-6 md:py-4 max-w-[1100px] w-full mx-auto">
      <div className="print-hide flex flex-wrap gap-2 items-center mb-4">
        <button className="dns-btn-primary" onClick={()=>window.print()}>⬇ {t.print}</button>
        <button className="dns-btn-primary bg-dns-mid" onClick={()=>printSimple('final')}>⬇ {t.printFinal}</button>
        <button className="dns-btn-primary bg-dns-mid" onClick={()=>printSimple('org')}>⬇ {t.printOrg}</button>
        <button className="dns-btn-secondary" onClick={reset}>↺ {t.reset}</button>
        <div className="md:ml-auto flex items-center gap-1.5 text-[10px] text-dns-muted px-2 py-1 border border-dns-border rounded bg-white"><span className={'w-[7px] h-[7px] rounded-full '+statusDot}/>{statusText}</div>
      </div>

      <SectionTitle>{t.parameters}</SectionTitle>
      <div className="grid grid-cols-1 min-[421px]:grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        {[[ 'PN',t.pn,'15%',t.direct],['SWDNS',t.sw,'55%',t.direct],['KP',t.kp,'20%',t.premium],['SA',t.sa,'10%',t.premium]].map((x,i)=><div key={x[0]} className="bg-white rounded-[10px] border-t-[3px] border-t-dns-light p-3 text-center shadow-[0_1px_4px_rgba(13,77,94,.07)]"><div className="font-display text-[15px] md:text-[17px] font-bold text-dns-deep">{x[0]}</div><div className="font-alt text-[9px] md:text-[10px] text-dns-muted my-1 min-h-[22px]">{x[1]}</div><div className="font-display text-lg md:text-[22px] font-bold text-dns-deep">{x[2]}</div><span className={'inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full '+(i<2?'bg-dns-light/20 text-dns-light':'bg-amber-200/20 text-amber-300')}>{x[3]}</span><div className="font-alt text-[9px] text-dns-muted/70 mt-1">{t.locked}</div></div>)}
      </div>
      <div className="dns-note">{t.note}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-4"><Kpi label={t.variableFee} value="€ 45.000" sub={t.fullDistribution}/><Kpi label={t.activePartners} value={String(results.filter(r=>r.score>0).length)} sub={t.scorePositive}/><Kpi label={t.highestShare} value={fmtE(maxR.varFee)} sub={maxR.name}/></div>

      <SectionTitle>{t.input}</SectionTitle>
      <div className="dns-table-wrap"><table className="dns-table"><thead><tr><th>{t.partner}</th><th>PN</th><th>SWDNS</th><th>KP % ★</th><th>SA ★</th></tr></thead><tbody>{regions.map((r,i)=><tr key={r.name}><td>{r.name}</td><td className="text-right"><FormattedIntInput value={r.PN} onCommit={value=>updateRegion(i,'PN',value)}/></td><td className="text-right"><FormattedIntInput value={r.SW} onCommit={value=>updateRegion(i,'SW',value)}/></td><td className="text-right"><input type="number" className="dns-input" min="0" max="100" value={r.KP} onChange={e=>updateRegion(i,'KP',Number(e.target.value)||0)}/></td><td className="text-right"><input type="number" className="dns-input" min="0" value={r.SA} onChange={e=>updateRegion(i,'SA',Number(e.target.value)||0)}/></td></tr>)}</tbody><tfoot><tr className="bg-dns-lighter font-bold text-dns-deep border-t-2 border-dns-light"><td className="px-2.5 py-2">{t.total}</td><td className="text-right px-2.5">{totalPN.toLocaleString('de-DE')}</td><td className="text-right px-2.5">{totalSW.toLocaleString('de-DE')}</td><td className="text-right px-2.5">—</td><td className="text-right px-2.5">{totalSA}</td></tr></tfoot></table></div>
      <div className="dns-note">{t.dataNote}</div>

      <SectionTitle>{t.result}</SectionTitle>
      <div className="dns-table-wrap"><table className="dns-table"><thead><tr><th>{t.partner}</th><th>PN w.</th><th>SWDNS w.</th><th>KP w.</th><th>SA w.</th><th>Score %</th><th>Variable Fee</th></tr></thead><tbody>{results.map(r=><tr key={r.name}><td>{r.name}</td><td className="text-right">{fmt2(r.pnW)}</td><td className="text-right">{fmt2(r.swW)}</td><td className="text-right">{fmt2(r.kpW)}</td><td className="text-right">{fmt2(r.saW)}</td><td className="text-right font-bold text-dns-deep">{fmt2(r.score)} %</td><td className="text-right font-bold text-green-800">{fmtE(r.varFee)}</td></tr>)}</tbody><tfoot><tr className="bg-dns-lighter font-bold text-dns-deep"><td className="px-2.5 py-2">{t.total}</td><td/><td/><td/><td/><td className="text-right">{fmt2(totalScore)} %</td><td className="text-right">{fmtE(totalVF)}</td></tr></tfoot></table></div>

      <SectionTitle>{t.distribution}</SectionTitle>
      <div className="bg-white border border-dns-border p-3 mb-4">{results.map(r=><div key={r.name} className="grid grid-cols-[115px_1fr_68px] md:grid-cols-[190px_1fr_75px] gap-2 items-center mb-1.5"><div className="text-[10px] md:text-[11px] md:text-right leading-tight">{r.name}</div><div className="bg-dns-lighter rounded h-[13px] md:h-[15px] overflow-hidden"><div className="h-full bg-gradient-to-r from-dns-mid to-dns-light rounded" style={{width:((r.varFee/maxR.varFee)*100).toFixed(1)+'%'}}/></div><div className="text-right text-[10px] md:text-[11px] font-semibold text-dns-deep">{fmtE(r.varFee)}</div></div>)}</div>

      <SectionTitle>{t.annual}</SectionTitle>
      <div className="dns-table-wrap"><table className="dns-table"><thead><tr><th>{t.partner}</th><th>Score %</th><th>Variable Fee</th><th>Fixed Fee</th><th>Tot. 2027</th><th>Quote 2026</th><th>+/−</th></tr></thead><tbody>{results.map((r,i)=>{const tot=r.varFee+FF,diff=tot-PREV[i];return <tr key={r.name}><td>{r.name}</td><td className="text-right">{fmt2(r.score)} %</td><td className="text-right font-bold text-green-800">{fmtE(r.varFee)}</td><td className="text-right">{fmtE(FF)}</td><td className="text-right font-bold text-dns-deep">{fmtE(tot)}</td><td className="text-right">{fmtE(PREV[i])}</td><td className={'text-right font-bold '+(diff>0?'text-orange-700':'text-green-800')}>{diff>0?'+':''}{fmtE(diff)}</td></tr>;})}</tbody><tfoot><tr className="bg-dns-lighter font-bold text-dns-deep border-t-2 border-dns-light"><td className="px-2.5 py-2">{t.total}</td><td className="text-right">{fmt2(totalScore)} %</td><td className="text-right">{fmtE(totalVF)}</td><td className="text-right">{fmtE(FF*N)}</td><td className="text-right">{fmtE(totalAll)}</td><td className="text-right">{fmtE(totalPrev)}</td><td className="text-right">{(totalAll-totalPrev)>0?'+':''}{fmtE(totalAll-totalPrev)}</td></tr></tfoot></table></div>
      <div className="dns-note">{t.vat}</div>

      <SectionTitle>{t.orgs}</SectionTitle>
      <div className="dns-table-wrap"><table className="dns-table"><thead><tr><th>{t.organisation}</th><th>{t.region}</th><th>{t.key}</th><th>Variable Fee</th><th>Fixed Fee</th><th>Tot. 2027</th></tr></thead><tbody>{ORGANISATIONS.flatMap(g=>{const area=results.find(r=>r.name===g.reg);return g.list.map((o,i)=>{const vf=(area?.varFee||0)*o[1],tot=vf+o[2];return <tr key={g.reg+o[0]}><td>{o[0]}</td><td>{i===0?g.reg:''}</td><td className="text-right">{fmt2(o[1]*100)} %</td><td className="text-right font-bold text-green-800">{fmtE(vf)}</td><td className="text-right">{fmtE(o[2])}</td><td className="text-right font-bold text-dns-deep">{fmtE(tot)}</td></tr>;});})}</tbody><tfoot><tr className="bg-dns-lighter font-bold text-dns-deep border-t-2 border-dns-light"><td className="px-2.5 py-2">{t.total}</td><td></td><td className="text-right">100,00 %</td><td className="text-right">{fmtE(orgTotals.vf)}</td><td className="text-right">{fmtE(orgTotals.ff)}</td><td className="text-right">{fmtE(orgTotals.total)}</td></tr></tfoot></table></div>
    </main>
    <footer className="bg-dns-deep text-white/75 px-3 md:px-6 py-2 text-[9px] md:text-[10px] flex justify-between flex-wrap gap-2"><span>Dolomiti NordicSki · FAIR Model · WS 2026/27</span><span>{new Date().toLocaleDateString('de-DE')}</span></footer>
  </div>;
}
