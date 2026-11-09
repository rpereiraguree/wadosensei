// Lógica pura da app (sem acesso a Firebase nem ao DOM) — testável em Node.
export const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
export const DOW=['dom','seg','ter','qua','qui','sex','sáb'];
export const DOWL=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
export const pad=n=>String(n).padStart(2,'0');
export const ds=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const today=()=>ds(new Date());
export const addDays=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return ds(d)};
export const dayDiff=(a,b)=>Math.round((new Date(b+'T12:00')-new Date(a+'T12:00'))/864e5);
export const wdOf=s=>new Date(s+'T12:00').getDay();
export const addMonths=(m,n)=>{let y=+m.slice(0,4),mo=+m.slice(5,7)-1+n;y+=Math.floor(mo/12);mo=((mo%12)+12)%12;return `${y}-${pad(mo+1)}`};
export const seasonOf=d=>{const y=+d.slice(0,4),m=+d.slice(5,7);return String(m>=9?y:y-1)};
export const seasonLabel=k=>`${String(k).slice(2)}/${String(+k+1).slice(2)}`;
export const seasonMonthsAll=k=>Array.from({length:12},(_,i)=>addMonths(`${k}-09`,i));
export const seasonRange=k=>({from:`${k}-09-01`,to:`${+k+1}-08-31`});
export const mLabel=m=>MESES[+m.slice(5,7)-1]+' '+m.slice(0,4);
export const mShort=m=>MESES[+m.slice(5,7)-1].slice(0,3);
export const fmtD=s=>{if(!s)return '';const[y,m,d]=s.split('-');return `${d}/${m}/${y.slice(2)}`};
export const eur=v=>(Math.round((+v||0)*100)/100).toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
export const round2=v=>Math.round((+v||0)*100)/100;
export function ageAt(b,d){if(!b)return null;const[by,bm,bd]=b.split('-').map(Number),[y,m,dd]=d.split('-').map(Number);let a=y-by;if(m<bm||(m===bm&&dd<bd))a--;return a}
export const tc=s=>String(s||'').toLowerCase().split(/\s+/).filter(Boolean).map(w=>['de','da','do','dos','das','e'].includes(w)?w:w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
export const shortName=n=>{const p=String(n||'').trim().split(/\s+/);return tc(p.length>1?p[0]+' '+p[p.length-1]:p[0]||'')};
export const nameOf=a=>a?(a.curto||shortName(a.nome)):'(removido)';

// Valor em vigor numa data/mês a partir de uma lista [{desde,...}]
export function hist(list,at){let r=null;for(const x of (list||[]))if(x&&x.desde&&x.desde<=at&&(!r||x.desde>=r.desde))r=x;return r}

// Escalões de Gallahue (só para planeamento) — idade a 31/12 do ano de início da época
export const ESCALOES=[[6,'Fundamental'],[10,'Transitório'],[13,'Aplicação'],[999,'Permanente']];
export function escalao(nasc,k){if(!nasc)return '';const a=ageAt(nasc,`${k}-12-31`);return ESCALOES.find(([max])=>a<=max)[1]}

/* ---------- Horários e aulas ---------- */
export function epocaOf(club,d){return club.epocas?.[seasonOf(d)]||null}
export function slotsOn(club,d){const ep=epocaOf(club,d);if(!ep||d<ep.inicio||(ep.fim&&d>ep.fim))return[];const h=hist(club.horarios,d);if(!h)return[];
  const wd=wdOf(d);return (h.slots||[]).filter(s=>+s.wd===wd).sort((a,b)=>(a.ini||'')<(b.ini||'')?-1:1)}
export function sessionsBetween(club,stored,from,to){const out={};
  for(let d=from;d<=to;d=addDays(d,1))for(const s of slotsOn(club,d)){const id=`${d}_${s.t}`;out[id]={id,data:d,turma:s.t,ini:s.ini||'',fim:s.fim||'',tipo:'normal',estado:'prevista',pres:{},virtual:true}}
  for(const id in stored){const s=stored[id];if(s.data>=from&&s.data<=to)out[id]={...(out[id]||{}),...s,id,virtual:false}}
  return Object.values(out).sort((a,b)=>a.data!==b.data?(a.data<b.data?-1:1):(a.ini||'')!==(b.ini||'')?((a.ini||'')<(b.ini||'')?-1:1):(a.turma<b.turma?-1:1))}
export const isGiven=s=>s&&!s.virtual&&s.estado==='dada';
export function pendingCancelled(stored){const reposed=new Set();for(const s of Object.values(stored))(s.repoe||[]).forEach(id=>reposed.add(id));
  return Object.values(stored).filter(s=>s.estado==='cancelada'&&!reposed.has(s.id)).sort((a,b)=>a.data<b.data?-1:1)}
export function reposedBy(stored,id){return Object.values(stored).find(s=>(s.repoe||[]).includes(id))||null}
const monday=s=>addDays(s,-((wdOf(s)+6)%7));
export function weekNo(club,d){const ep=epocaOf(club,d);const start=ep?.inicio||`${seasonOf(d)}-09-01`;return Math.floor(dayDiff(monday(start),monday(d))/7)+1}
export function suggestCode(club,stored,s){const k=seasonOf(s.data);
  const n=Object.values(stored).filter(x=>x.id!==s.id&&x.turma===s.turma&&isGiven(x)&&seasonOf(x.data)===k&&(x.data<s.data||(x.data===s.data&&(x.ini||'')<(s.ini||'')))).length;
  const t=(club.turmas||[]).find(t=>t.id===s.turma);return `${t?.pre||s.turma}-S${pad(weekNo(club,s.data))}A${pad(n+1)}`}

/* ---------- Assiduidade ---------- */
export function attStats(stored,from,to,w=0.2){const o={};
  for(const s of Object.values(stored)){if(!isGiven(s)||s.data<from||s.data>to)continue;const rep=s.tipo==='reposicao'||s.tipo==='extra';
    for(const id in (s.pres||{})){const v=s.pres[id];if(!['P','F','J'].includes(v))continue;if(rep&&v!=='P')continue;const x=o[id]||(o[id]={P:0,F:0,J:0,hist:[]});x[v]++;x.hist.push([s.data,v])}}
  for(const id in o){const x=o[id];x.tot=x.P+x.F+x.J;x.pct=x.tot?(x.P+w*x.J)/x.tot:null;x.hist.sort((a,b)=>a[0]<b[0]?-1:1)}return o}
export function monthPres(stored){const o={};for(const s of Object.values(stored)){if(!isGiven(s))continue;const m=s.data.slice(0,7);for(const id in (s.pres||{}))if(s.pres[id]==='P')(o[m]||(o[m]={}))[id]=true}return o}

/* ---------- Inscrições e mensalidades ---------- */
export const enr=(a,k)=>a?.insc?.[k]||null;
export function activeIn(a,k,m){const e=enr(a,k);return !!e&&(!e.desde||m>=e.desde)&&(!e.ate||m<=e.ate)}
export function freqAt(e,m){const h=hist(e?.freq,m);return h?+h.n:((e?.dias||[]).length||1)}
export function firstPaid(payments,id){const ms=Object.keys(payments).filter(m=>payments[m]?.[id]?.s==='P').sort();return ms[0]||null}
export function amigoWindows(ath,athletes,payments,len=3){const starts=[];
  if(ath.trazidoPor){const f=firstPaid(payments,ath.id);if(f)starts.push(f)}
  for(const o of Object.values(athletes))if(o.trazidoPor===ath.id){const f=firstPaid(payments,o.id);if(f)starts.push(f)}
  starts.sort();const w=[];let prevEnd=null;for(const s of starts){const a=prevEnd&&s<=prevEnd?addMonths(prevEnd,1):s;const b=addMonths(a,len-1);w.push([a,b]);prevEnd=b}return w}
export function monthValue(club,ath,ctx,k,m){const e=enr(ath,k)||{};const f=freqAt(e,m);const man=hist(e.manual,m);
  if(man&&man.v!==''&&man.v!=null)return{v:+man.v,f,base:+man.v,desc:[],descTot:0,manual:man.nota||'valor especial'};
  const vv=hist(club.cfg?.valores,m)||{};const base=+(vv[f]??vv[2]??0);const desc=[];
  const rule=t=>hist((club.cfg?.descontos||[]).filter(r=>r.tipo===t),m);const val=r=>+(f===1?r.v1:r.v2)||0;
  let r=rule('irmao');if(r&&val(r)&&ath.irmaos){const g=ath.irmaos.trim().toLowerCase();if(Object.values(ctx.athletes).some(o=>o.id!==ath.id&&(o.irmaos||'').trim().toLowerCase()===g&&activeIn(o,k,m)))desc.push(['Irmão no karaté',val(r)])}
  r=rule('irmaoOutra');if(r&&val(r)&&ath.irmaoOutra)desc.push(['Irmão noutra modalidade',val(r)]);
  r=rule('amigo');if(r&&val(r)&&amigoWindows(ath,ctx.athletes,ctx.payments,+r.meses||3).some(([a,b])=>m>=a&&m<=b))desc.push(['Traz um amigo',val(r)]);
  let tot=desc.reduce((s,x)=>s+x[1],0);const max=club.cfg?.descMax===''||club.cfg?.descMax==null?Infinity:+club.cfg.descMax;if(tot>max)tot=max;
  return{v:round2(Math.max(0,base-tot)),f,base,desc,descTot:tot}}
export function monthStatus(club,ath,ctx,k,m){const e=enr(ath,k);if(!e||!activeIn(ath,k,m)||!(club.epocas?.[k]?.meses||[]).includes(m))return null;
  const p=ctx.payments[m]?.[ath.id];
  if(p?.s==='P')return{st:'pago',v:+p.v,d:p.d||'',f:freqAt(e,m)};
  if(p?.s==='I')return{st:'isento'};
  if(e.isento)return{st:'isentoFixo'};
  const val=monthValue(club,ath,ctx,k,m);
  if(!ctx.mp[m]?.[ath.id])return{st:'semPres',v:val.v,val};
  return{st:'falta',v:val.v,val}}
export function dueList(club,ctx,k,upto){const o=[];for(const m of (club.epocas?.[k]?.meses||[])){if(m>upto)continue;
  for(const a of Object.values(ctx.athletes)){const s=monthStatus(club,a,ctx,k,m);if(s&&s.st==='falta')o.push({id:a.id,m,v:s.v,f:s.val.f})}}return o}
export function recebido(ctx,m){let r=0;const p=ctx.payments[m]||{};for(const id in p)if(p[id].s==='P')r+=+p[id].v||0;return round2(r)}
export function finGestao(club,ctx,k,m){const cfg=club.cfg||{};const pct=(+hist(cfg.pctEspaco,m)?.v||0)/100,sh=(+cfg.poupShare||0)/100;
  const rec=recebido(ctx,m),poup=rec>0?(+hist(cfg.poupMensal,m)?.v||0):0;
  const due=dueList(club,ctx,k,m).reduce((a,x)=>a+x.v,0);
  return{rec,poup,pct:pct*100,ent:round2(rec*pct-poup*sh),tr:round2(rec*(1-pct)-poup*(1-sh)),due:round2(due),dueEnt:round2(due*pct),dueTr:round2(due*(1-pct))}}
export function poupanca(club,ctx,k){const cfg=club.cfg||{};const ep=club.epocas?.[k]||{};let ent=0;const now=today().slice(0,7);
  for(const m of (ep.meses||[])){if(m>now)break;if(recebido(ctx,m)>0)ent+=+hist(cfg.poupMensal,m)?.v||0}
  let said=0,pess=0,reemb=0,aj=0;const movs=Object.values(ctx.ledger||{}).filter(x=>seasonOf(x.data)===k).sort((a,b)=>a.data<b.data?1:-1);
  for(const x of movs){const v=+x.v||0;if(x.tipo==='saida')said+=v;else if(x.tipo==='pessoal')pess+=v;else if(x.tipo==='reembolso')reemb+=v;else if(x.tipo==='ajuste')aj+=v}
  const ini=+ep.poupInicial||0;return{ini,ent:round2(ent),said:round2(said),reemb:round2(reemb),aj:round2(aj),pend:round2(pess-reemb),saldo:round2(ini+ent+aj-said-reemb),movs}}
export function profMonth(club,ctx,k,m){const cfg=club.cfg||{};const ativos=Object.values(ctx.athletes).filter(a=>activeIn(a,k,m)).length;
  const days=new Set(Object.values(ctx.sessions).filter(s=>isGiven(s)&&s.data.slice(0,7)===m).map(s=>s.data));
  const va=+cfg.valorAluno||0,vl=+cfg.valorAula||0;const r=ctx.receitas?.[m];
  const porAluno=round2(ativos*va),porAula=round2(days.size*vl);const prev=cfg.modeloPag==='aula'?porAula:porAluno;
  return{ativos,aulas:days.size,porAluno,porAula,prev,rec:r?+r.valor:null,recD:r?.data||'',nota:r?.nota||'',dif:r?round2(+r.valor-prev):null}}

/* ---------- Quotas e taxas ---------- */
export const QITEMS=[['fed','Federação'],['ass','Associação'],['seg','Seguro']];
export function quotaValue(meta,ano,item,red,nasc,date){const t=meta?.quotas?.[ano]?.[item]||{};const a=nasc?ageAt(nasc,date):99;const inf=a!=null&&a<=9;
  if(red&&item!=='seg')return +(inf?t.redInf:t.redNorm)||0;return +(inf?t.inf:t.norm)||0}
export function feeValue(meta,fee,ath,date){if(fee.estado!=='falta'&&fee.v!=null)return +fee.v;return quotaValue(meta,fee.ano,fee.item,fee.red,ath?.nasc,date)}
export function moneySummary(meta,ctx,date){let falta=0,mao=0;
  for(const f of Object.values(ctx.fees||{})){const v=feeValue(meta,f,ctx.athletes[f.ath],date);if(f.estado==='falta')falta+=v;else if(f.estado==='cobrado')mao+=v}
  for(const ev of Object.values(ctx.events||{}))for(const id in (ev.atl||{})){const x=ev.atl[id];const v=+(x.v??ev.valor)||0;if(x.estado==='falta')falta+=v;else if(x.estado==='cobrado')mao+=v}
  return{falta:round2(falta),mao:round2(mao)}}

/* ---------- Pontos e classificações ---------- */
export const TRIM=[['T1','1.º trimestre','09-01','12-31',0],['T2','2.º trimestre','01-01','03-31',1],['T3','3.º trimestre','04-01','08-31',1]];
export function trimRange(k,t){if(t==='E')return seasonRange(k);const x=TRIM.find(z=>z[0]===t);const y=+k+x[4];return{from:`${y}-${x[2]}`,to:`${y}-${x[3]}`}}
export function assidPts(meta,pct){if(pct==null)return 0;const tiers=[...(meta?.assidTiers||[])].sort((a,b)=>b.min-a.min);for(const t of tiers)if(pct*100>=+t.min)return +t.pts;return 0}
export function pointsTable(club,ctx,meta,k,t){const w=+club.cfg?.pesoJ||0.2;const per=t==='E'?TRIM.map(x=>trimRange(k,x[0])):[trimRange(k,t)];const R=trimRange(k,t);
  const stP=per.map(r=>attStats(ctx.sessions,r.from,r.to,w));const stR=attStats(ctx.sessions,R.from,R.to,w);const o={};
  for(const a of Object.values(ctx.athletes)){const e=enr(a,k);if(!e)continue;
    const as=stP.reduce((s,st)=>s+assidPts(meta,st[a.id]?.pct??null),0);
    const prem=Object.values(ctx.awards||{}).filter(x=>x.ath===a.id&&x.data>=R.from&&x.data<=R.to).reduce((s,x)=>s+(+x.pts||0),0);
    const ev=Object.values(ctx.events||{}).filter(x=>x.data>=R.from&&x.data<=R.to&&x.atl?.[a.id]).reduce((s,x)=>s+(+x.pontos||0),0);
    o[a.id]={id:a.id,turma:e.turma,pct:stR[a.id]?.pct??null,assid:as,prem,ev,tot:as+prem+ev}}return o}

/* ---------- Testes físicos ---------- */
export function bestOf(test,arr){const v=(arr||[]).filter(x=>x!==''&&x!=null&&!isNaN(+x)).map(Number);if(!v.length)return null;return test.melhor==='min'?Math.min(...v):Math.max(...v)}
export function testHistory(tests,athId,testId){const o=[];for(const s of Object.values(tests||{})){if(!(s.testes||[]).includes(testId))continue;const r=s.res?.[athId]?.[testId];if(r&&r.some(x=>x!==''&&x!=null))o.push({data:s.data,id:s.id,r})}return o.sort((a,b)=>a.data<b.data?-1:1)}
export function prevResult(tests,test,athId,beforeDate,excludeId){const h=testHistory(tests,athId,test.id).filter(x=>x.data<=beforeDate&&x.id!==excludeId);if(!h.length)return null;return bestOf(test,h[h.length-1].r)}
export function improved(test,cur,prev){if(cur==null||prev==null)return 0;const d=cur-prev;if(Math.abs(d)<1e-9)return 0;return (test.melhor==='min'?-d:d)>0?1:-1}
export function fmtNum(v,dec){if(v==null)return '—';return (+v).toLocaleString('pt-PT',{minimumFractionDigits:dec||0,maximumFractionDigits:dec||0})}

/* ---------- Mensagens ---------- */
export function fill(tpl,vars){return String(tpl||'').replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'')}
export function joinPt(parts){return parts.length>1?parts.slice(0,-1).join(', ')+' e '+parts[parts.length-1]:(parts[0]||'')}
export function payDetail(items){const parts=items.map(x=>`${MESES[+x.m.slice(5,7)-1].toLowerCase()} (${x.f} aula${x.f>1?'s':''}/semana · ${eur(x.v)})`);
  let s=joinPt(parts);if(items.length>1)s+=`, total ${eur(items.reduce((a,x)=>a+(+x.v||0),0))}`;return s}
export function feeDetail(items){const parts=items.map(x=>`${x.label} (${eur(x.v)})`);let s=joinPt(parts);if(items.length>1)s+=`, total ${eur(items.reduce((a,x)=>a+(+x.v||0),0))}`;return s}
export function msgLink(tel,canal,text){let t=String(tel||'').replace(/\D/g,'');if(!t)return null;if(t.length===9)t='351'+t;
  return canal==='sms'?`sms:+${t}?body=${encodeURIComponent(text)}`:`https://wa.me/${t}?text=${encodeURIComponent(text)}`}

/* ---------- Aniversários (.ics) ---------- */
const icsEsc=s=>String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
export function icsBirthdays(list,stamp){const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//wadosensei//aniversarios//PT','CALSCALE:GREGORIAN','X-WR-CALNAME:Aniversários Karaté'];
  const st=(stamp||new Date().toISOString()).replace(/[-:]/g,'').slice(0,15)+'Z';
  for(const a of list){if(!a.nasc)continue;const d=a.nasc.replace(/-/g,'');const end=addDays(a.nasc,1).replace(/-/g,'');
    L.push('BEGIN:VEVENT',`UID:aniv-${a.id}@wadosensei`,`DTSTAMP:${st}`,`DTSTART;VALUE=DATE:${d}`,`DTEND;VALUE=DATE:${end}`,'RRULE:FREQ=YEARLY',
      `SUMMARY:${icsEsc('🎂 '+a.nome+(a.clube?' · '+a.clube:''))}`,`DESCRIPTION:${icsEsc('Nasceu em '+a.nasc.slice(0,4))}`,'TRANSP:TRANSPARENT',
      'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${icsEsc('Amanhã faz anos: '+a.nome)}`,'TRIGGER:-PT15H','END:VALARM',
      'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${icsEsc('Hoje faz anos: '+a.nome)}`,'TRIGGER:PT9H','END:VALARM','END:VEVENT')}
  L.push('END:VCALENDAR');return L.join('\r\n')+'\r\n'}
export function upcomingBirthdays(list,from,days){const o=[];for(const a of list){if(!a.nasc)continue;
  for(let i=0;i<=days;i++){const d=addDays(from,i);if(d.slice(5)===a.nasc.slice(5)){o.push({a,d,i,age:ageAt(a.nasc,d)});break}}}return o.sort((x,y)=>x.i-y.i)}

/* ---------- Importação de lista de atletas ---------- */
export function parseAthleteList(text){const out=[];for(const raw of String(text||'').split(/\r?\n/)){const line=raw.trim();if(!line)continue;
  const p=line.split(/\t|;|,(?=\s*\d)/).map(s=>s.trim()).filter(s=>s!=='');if(!p.length)continue;
  let nome='',nasc='',fnkp='';for(const x of p){if(/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}$/.test(x)){const[d,m,y]=x.split(/[\/.-]/);nasc=`${y}-${pad(m)}-${pad(d)}`}
    else if(/^\d{4}-\d{2}-\d{2}$/.test(x))nasc=x;else if(/^\d{3,7}$/.test(x))fnkp=x;else if(!nome)nome=x}
  if(nome&&!/^nome$/i.test(nome))out.push({nome:nome.toUpperCase(),nasc,fnkp})}return out}
