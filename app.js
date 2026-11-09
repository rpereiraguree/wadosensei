import * as L from './logic.js';
import {DB,init,api} from './store.js';
import {seedClubs,seedMeta} from './seed.js';

const FIREBASE={apiKey:"AIzaSyC6LSMa62K2QOfQNqyJaK4n9uU8_ZbcvUA",authDomain:"wadosensei.firebaseapp.com",projectId:"wadosensei",storageBucket:"wadosensei.firebasestorage.app",messagingSenderId:"613268049409",appId:"1:613268049409:web:cbb2bd7de5f88e1bbcba00"};
const DEMO=new URLSearchParams(location.search).has('demo');
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);
const copy=o=>JSON.parse(JSON.stringify(o));
const {today,fmtD,eur,mShort,mLabel,DOW,DOWL,seasonLabel,nameOf}=L;
const pref=(k,v)=>{try{if(v===undefined)return JSON.parse(localStorage.getItem('ws_'+k)||'null');localStorage.setItem('ws_'+k,JSON.stringify(v))}catch(e){return null}};
const QS=new URLSearchParams(location.search);const UI={tab:['hoje','aulas','atletas','contas','mais'].includes(QS.get('tab'))?QS.get('tab'):'hoje',club:pref('club'),season:pref('season')||{},aul:{m:null,t:''},ath:{f:'ins',q:''},con:{v:null,m:null,qa:null,qv:'quotas'},pre:{t:null},sheetLive:null,draft:null,sw:{mode:'ind',t0:0,run:false,ath:null}};

/* ---------- acesso a dados ---------- */
const CL=()=>DB.clubs[UI.club];
const CD=()=>CL().doc;
const META=()=>DB.meta||seedMeta();
function K(){const eps=Object.keys(CD().epocas||{}).sort();let k=UI.season[UI.club];if(!k||!eps.includes(k)){const c=L.seasonOf(today());k=eps.includes(c)?c:eps[eps.length-1]}return k}
let _ctx=null;
const ctx=()=>_ctx||(_ctx=(()=>{const c=CL();return{athletes:c.athletes,sessions:c.sessions,payments:c.payments,receitas:c.receitas,fees:c.fees,events:c.events,ledger:c.ledger,awards:c.awards,tests:c.tests,mp:L.monthPres(c.sessions)}})());
const put=(col,id,data)=>api().put(UI.club,col,id,data);
const del=(col,id)=>api().del(UI.club,col,id);
const saveClub=doc=>api().put(UI.club,null,null,doc);
const turma=id=>(CD().turmas||[]).find(t=>t.id===id)||{id,nome:id,pre:id};
const curMonth=k=>{const ms=CD().epocas?.[k]?.meses||[];const t=today().slice(0,7);if(ms.includes(t))return t;const p=ms.filter(m=>m<=t);return p.length?p[p.length-1]:ms[0]||t};
const athsIn=(k,t,m)=>Object.values(ctx().athletes).filter(a=>{const e=L.enr(a,k);return e&&(!t||e.turma===t)&&(!m||L.activeIn(a,k,m))}).sort((a,b)=>nameOf(a).localeCompare(nameOf(b)));
const N=id=>nameOf(ctx().athletes[id]);

function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('show'),2000)}
function dl(name,text,type){const b=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
function sendMsg(ath,text){const link=L.msgLink(ath?.tel,ath?.canal,text);if(link){window.open(link,'_blank');return}
  if(navigator.clipboard)navigator.clipboard.writeText(text).then(()=>toast('Sem telemóvel na ficha — mensagem copiada'),()=>prompt('Copia a mensagem',text));else prompt('Copia a mensagem',text)}

/* ---------- arranque ---------- */
function onData(){_ctx=null;if(UI.club&&!DB.clubs[UI.club])UI.club=null;if(!UI.club){const ids=Object.keys(DB.clubs).filter(id=>DB.clubs[id].doc);if(ids.length)UI.club=ids.includes('cart')?'cart':ids[0]}
  render();refreshSheet();if(QS.get('repo')&&CL()?.doc&&!UI.repoDone){UI.repoDone=true;repoDraft(null,false)}}
function refreshSheet(){if(!UI.sheetLive||$('#sheet').classList.contains('hidden'))return;const ae=document.activeElement;
  if(ae&&$('#sheetBody').contains(ae)&&/INPUT|TEXTAREA|SELECT/.test(ae.tagName)){UI.deferSheet=true;return}UI.deferSheet=false;const b=$('#sheetBody'),sc=b.scrollTop;UI.sheetLive();b.scrollTop=sc}
document.addEventListener('focusout',()=>setTimeout(()=>{if(UI.deferSheet)refreshSheet()},60));
init(FIREBASE,onData,DEMO).catch(e=>{$('#view').innerHTML=`<div class="card banner"><b>Não foi possível carregar a app</b><p class="sm">${esc(e.message)}</p><p class="sm">Na primeira utilização precisas de internet.</p></div>`});
if('serviceWorker' in navigator&&!DEMO)navigator.serviceWorker.register('sw.js').catch(()=>{});
addEventListener('online',()=>render());addEventListener('offline',()=>render());

/* ---------- render principal ---------- */
const TABS=[['hoje','Hoje','<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],['aulas','Aulas','<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'],
  ['atletas','Atletas','<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 8M22 21v-1a6 6 0 0 0-4-5.6"/>'],['contas','Contas','<path d="M18 7a6.5 6.5 0 1 0 0 10"/><path d="M4 10h9M4 14h9"/>'],
  ['mais','Mais','<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>']];
const MAIS_SUB=['premios','testes','aniv','config','geral','dados'];
function render(){
  const hdr=$('#hdr'),nav=$('#tabs'),view=$('#view');
  if(!DB.authReady){hdr.innerHTML='<h1>Wado Sensei</h1>';nav.innerHTML='';view.innerHTML='<div class="empty">A carregar…</div>';return}
  if(!DB.user){hdr.innerHTML='<h1>Wado Sensei</h1>';nav.innerHTML='';view.innerHTML=`<div class="login"><img src="icon-192.png" alt="" width="96" height="96"><h2>Wado Sensei</h2><p class="muted">Gestão dos clubes de karaté</p><button class="btn" data-a="login">Entrar com Google</button></div>`;return}
  if(!DB.metaLoaded||!DB.clubsLoaded){hdr.innerHTML='<h1>Wado Sensei</h1>';nav.innerHTML='';view.innerHTML=`<div class="empty">A carregar dados…${DB.error?'<br><br>'+esc(DB.error):''}</div>`;return}
  if(!UI.club||!CL()?.doc){hdr.innerHTML='<h1>Wado Sensei</h1>';nav.innerHTML='';view.innerHTML=V.welcome();return}
  const k=K();const sync=!navigator.onLine?'<span class="sync off" title="Sem rede — grava quando voltar">offline</span>':DB.pending?'<span class="sync">a gravar…</span>':'';
  hdr.innerHTML=`<select data-c="club" aria-label="Clube" class="clubsel">${Object.values(DB.clubs).filter(c=>c.doc).map(c=>`<option value="${c.doc.id}" ${c.doc.id===UI.club?'selected':''}>${esc(c.doc.nome)}</option>`).join('')}<option value="__new">+ Novo clube…</option></select>${sync}
    <select data-c="season" aria-label="Época">${Object.keys(CD().epocas||{}).sort().map(s=>`<option value="${s}" ${s===k?'selected':''}>${seasonLabel(s)}</option>`).join('')}</select>`;
  const on=MAIS_SUB.includes(UI.tab)?'mais':UI.tab;
  nav.innerHTML=TABS.map(([t,l,ic])=>`<button data-a="tab" data-t="${t}" class="${on===t?'on':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ic}</svg>${l}</button>`).join('');
  view.innerHTML=(DB.error?`<div class="card banner sm">${esc(DB.error)} <button class="btn sm ghost" data-a="clrErr">OK</button></div>`:'')+V[UI.tab]();
}
const V={};
const empty=t=>`<div class="empty">${t}</div>`;
const back=t=>`<div class="ch"><button class="btn sm ghost" data-a="tab" data-t="mais">‹ Mais</button><h2 style="margin:0">${t}</h2><span></span></div>`;

V.welcome=()=>`<div class="card"><h2>Bem-vindo, Sensei</h2><p>Ainda não há clubes nesta conta. Posso criar já os dois clubes com tudo o que definimos: horários, turmas, valores e descontos.</p><p class="sm">Depois importa os atletas e o histórico de 25/26 em <b>Mais → Dados e backup → Importar backup</b>, com o ficheiro <b>cart-2025-26.json</b> (guardado só contigo, nunca no GitHub).</p>
  <button class="btn block" data-a="seedAll">Criar Cart Wado Karaté + Flexgym</button><button class="btn ghost block" data-a="newClub">Começar com um clube vazio</button>
  <p class="muted sm" style="margin-top:12px">Sessão: ${esc(DB.user.email)} · <a href="#" data-a="logout">sair</a></p></div>`;

/* ---------- HOJE ---------- */
function sessionsOn(d){return L.sessionsBetween(CD(),CL().sessions,d,d)}
function sessCounts(s){const k=L.seasonOf(s.data);const exp=athsIn(k,s.turma,s.data.slice(0,7)).filter(a=>(L.enr(a,k).dias||[]).includes(L.wdOf(s.data))).length;const P=Object.values(s.pres||{}).filter(v=>v==='P').length;return{exp,P}}
function chipOf(s){const t=today();if(s.estado==='feriado')return `<span class="tag t-mut">${esc(s.motivo||'Feriado')}</span>`;if(s.estado==='cancelada'){const r=L.reposedBy(CL().sessions,s.id);return `<span class="tag t-bad">Cancelada${r?' · reposta':' · por repor'}</span>`}
  if(s.virtual)return s.data<t?'<span class="tag t-warn">Por registar</span>':'<span class="tag t-mut">Prevista</span>';
  const lab=s.tipo==='reposicao'?'Reposição':s.tipo==='extra'?'Extra':'Dada';
  if(s.estado!=='dada')return `<span class="tag t-blue">${lab==='Dada'?'Prevista':lab+' prevista'}</span>`;return `<span class="tag ${s.tipo==='normal'?'t-ok':'t-blue'}">${lab}</span>`}
function sessRow(s,showDate){const c=sessCounts(s);const t=turma(s.turma);
  return `<div class="li" data-a="openSess" data-id="${s.id}"><div class="grow"><div class="nm">${showDate?`${DOW[L.wdOf(s.data)]} ${fmtD(s.data).slice(0,5)} · `:''}${esc(t.nome)} <span class="muted sm">${esc(s.ini||'')}${s.fim?'–'+esc(s.fim):''}</span></div>
    <div class="muted sm">${s.plano?`<b class="code">${esc(s.plano)}</b> · `:''}${s.estado==='cancelada'||s.estado==='feriado'?esc(s.motivo||''):`${c.P} presentes${s.tipo==='normal'?' de '+c.exp:''}`}</div></div>${chipOf(s)}</div>`}
V.hoje=()=>{const cd=CD(),k=K(),t=today(),cx=ctx();let h='';
  let d=t,ss=sessionsOn(t);if(!ss.length){for(let i=1;i<15&&!ss.length;i++){d=L.addDays(t,i);ss=sessionsOn(d)}}
  h+=`<div class="ch"><h3>${d===t?'Aulas de hoje':'Próximas aulas'}</h3><span class="muted sm">${DOWL[L.wdOf(d)]} ${fmtD(d)}</span></div>`;
  h+=ss.length?`<div class="list">${ss.map(s=>sessRow(s)).join('')}</div>`:empty('Sem aulas nos próximos dias.');
  const pend=L.pendingCancelled(CL().sessions);
  if(pend.length)h+=`<div class="card"><div class="ch"><div><b>${pend.length} aula${pend.length>1?'s':''} por repor</b><div class="muted sm">${pend.map(s=>`${turma(s.turma).nome} ${fmtD(s.data).slice(0,5)}`).join(' · ')}</div></div><button class="btn sm" data-a="newRepo">Repor</button></div></div>`;
  const al=[];const m=curMonth(k);
  const ins=athsIn(k,'',m);
  const bd=L.upcomingBirthdays(ins,t,7);
  if(bd.length)al.push(`<div class="srow"><div class="grow"><b>🎂 Aniversários</b>${bd.map(x=>`<div class="row gap" style="margin-top:6px"><span class="grow sm">${x.i===0?'<b>Hoje</b>':x.i===1?'Amanhã':DOW[L.wdOf(x.d)]+' '+fmtD(x.d).slice(0,5)} · ${esc(nameOf(x.a))} faz ${x.age}</span>${x.i<=1?`<button class="btn sm ghost" data-a="parab" data-id="${x.a.id}">Parabéns</button>`:''}</div>`).join('')}</div></div>`);
  if(cd.modelo==='gestao'){const due=L.dueList(cd,cx,k,m);const ids=[...new Set(due.map(x=>x.id))];
    if(ids.length)al.push(`<div class="srow"><div class="grow"><b>Mensalidades em falta · ${eur(due.reduce((a,x)=>a+x.v,0))}</b><div class="muted sm">${ids.slice(0,6).map(N).join(', ')}${ids.length>6?'…':''}</div></div><button class="btn sm ghost" data-a="goContas" data-v="mens">Ver</button></div>`)}
  else{const pm=L.addMonths(t.slice(0,7),-1);if((cd.epocas?.[k]?.meses||[]).includes(pm)&&!cx.receitas[pm])al.push(`<div class="srow"><div class="grow"><b>Remuneração de ${L.MESES[+pm.slice(5)-1].toLowerCase()} por registar</b><div class="muted sm">Previsto ${eur(L.profMonth(cd,cx,k,pm).prev)}</div></div><button class="btn sm ghost" data-a="goContas" data-v="rem">Registar</button></div>`)}
  const ms=L.moneySummary(META(),cx,t);if(ms.falta||ms.mao)al.push(`<div class="srow"><div class="grow"><b>Quotas e taxas</b><div class="muted sm">Por cobrar ${eur(ms.falta)} · Em mão (para entregar) ${eur(ms.mao)}</div></div><button class="btn sm ghost" data-a="goContas" data-v="quotas">Ver</button></div>`);
  const Y=t.slice(0,4);if(+t.slice(5,7)<=3&&ins.length&&!Object.values(cx.fees).some(f=>f.ano===Y))al.push(`<div class="srow"><div class="grow"><b>Quotas de ${Y} ainda não geradas</b><div class="muted sm">Federação, associação e seguro para os atletas inscritos.</div></div><button class="btn sm" data-a="genQuotas" data-y="${Y}">Gerar</button></div>`);
  const st=L.attStats(cd,cx,L.seasonRange(k).from,L.seasonRange(k).to,+cd.cfg?.pesoJ||0.2);
  const low=ins.filter(a=>{const x=st[a.id];if(!x)return false;const r=x.hist.slice(-6);return r.length>=4&&r.filter(z=>z[1]!=='F').length/r.length<.5});
  if(low.length)al.push(`<div class="srow"><div class="grow"><b>Assiduidade baixa nas últimas aulas</b><div class="muted sm">${low.map(nameOf).join(', ')}</div></div></div>`);
  if(!ins.length)al.push(`<div class="srow"><div class="grow"><b>Época ${seasonLabel(k)} sem atletas inscritos</b><div class="muted sm">Inscreve quem continua e adiciona os novos.</div></div><button class="btn sm" data-a="goInscrever">Inscrever</button></div>`);
  h+=`<div class="card"><h3 style="margin-bottom:6px">Alertas</h3>${al.length?al.join(''):'<div class="muted sm">Tudo em dia.</div>'}</div>`;
  return h};

/* ---------- AULAS ---------- */
V.aulas=()=>{const k=K(),ep=CD().epocas[k]||{};const months=[];if(ep.inicio){let m=ep.inicio.slice(0,7);const end=(ep.fim||L.addDays(ep.inicio,330)).slice(0,7);while(m<=end){months.push(m);m=L.addMonths(m,1)}}
  if(!UI.aul.m||!months.includes(UI.aul.m))UI.aul.m=months.includes(today().slice(0,7))?today().slice(0,7):months[months.length-1];const m=UI.aul.m;
  const last=L.addDays(L.addMonths(m,1)+'-01',-1);let ss=L.sessionsBetween(CD(),CL().sessions,m+'-01',last);if(UI.aul.t)ss=ss.filter(s=>s.turma===UI.aul.t);
  let h=`<div class="row gap"><select data-c="aulM" class="grow">${months.map(x=>`<option value="${x}" ${x===m?'selected':''}>${mLabel(x)}</option>`).join('')}</select><button class="btn" data-a="newRepo">+ Reposição</button></div>
   <div class="row gap" style="margin-top:8px"><button class="btn ghost grow" data-a="newEvA">+ Evento</button><button class="btn ghost grow" data-a="planMes">🖨 Plano do mês</button></div>
   <div class="chips"><button class="chip ${!UI.aul.t?'on':''}" data-a="aulT" data-t="">Todas</button>${CD().turmas.map(t=>`<button class="chip ${UI.aul.t===t.id?'on':''}" data-a="aulT" data-t="${t.id}">${esc(t.nome)}</button>`).join('')}</div>`;
  const evs=Object.values(ctx().events).filter(e=>e.data>=m+'-01'&&e.data<=last);
  if(!ss.length&&!evs.length)return h+empty('Sem aulas neste mês.');
  const given=ss.filter(L.isGiven).length,canc=ss.filter(s=>s.estado==='cancelada').length,por=ss.filter(s=>s.virtual&&s.estado!=='feriado'&&s.data<today()).length;
  const items=[...ss.map(s=>({d:s.data,k:(s.ini||'')+'0',html:sessRow(s,true)})),...evs.map(e=>({d:e.data,k:'zz',html:`<div class="li ev" data-a="editEv" data-id="${e.id}"><div class="grow"><div class="nm">${DOW[L.wdOf(e.data)]} ${fmtD(e.data).slice(0,5)} · ${esc(e.nome)}</div><div class="muted sm">${esc(e.local||'')}${(e.horario||'').trim()?' · '+esc(e.horario.trim().split('\n')[0]):''}</div></div><span class="tag t-warn">Evento</span></div>`}))].sort((a,b)=>a.d!==b.d?(a.d<b.d?-1:1):(a.k<b.k?-1:1));
  h+=`<p class="muted sm">${given} dadas · ${canc} canceladas${por?` · <b style="color:var(--warn)">${por} por registar</b>`:''}${evs.length?` · ${evs.length} evento(s)`:''}</p><div class="list">${items.map(x=>x.html).join('')}</div>`;
  h+=`<button class="btn ghost block" data-a="newExtra">+ Aula extra</button>`;return h};

function openSess(id){const st=CL().sessions[id];let v=null;if(!st){const[d,t]=id.split('_');v=sessionsOn(d).find(s=>s.id===id);if(!v)return}
  UI.sess={id,v,aw:null};UI.sheetLive=renderSess;renderSess()}
function getSess(){const st=CL().sessions[UI.sess.id];return st?{...copy(st),id:UI.sess.id,virtual:false}:copy(UI.sess.v)}
function saveSess(s){const d={...s,id:UI.sess.id};delete d.virtual;put('sessions',UI.sess.id,d)}
function renderSess(){const s=getSess(),cd=CD(),k=L.seasonOf(s.data),t=turma(s.turma),wd=L.wdOf(s.data),m=s.data.slice(0,7);
  const rep=s.tipo!=='normal';
  let h=shH(`${DOWL[wd]} ${fmtD(s.data)}`)+`<div class="muted" style="margin:-6px 0 10px">${esc(t.nome)} · ${esc(s.ini||'')}${s.fim?'–'+esc(s.fim):''}${rep?` · <b>${s.tipo==='reposicao'?'Reposição':'Aula extra'}</b>`:''}</div>`;
  if(!rep)h+=`<div class="seg"><button class="${s.estado==='dada'?'on':''}" data-a="sessEst" data-v="dada">Dada</button><button class="${s.estado==='cancelada'?'on':''}" data-a="sessEst" data-v="cancelada">Cancelada</button></div>`;
  if(rep&&s.repoe?.length)h+=`<p class="muted sm">Repõe: ${s.repoe.map(id=>{const x=CL().sessions[id];return x?`${turma(x.turma).nome} de ${fmtD(x.data)}`:id}).join(', ')}</p>`;
  if(s.estado==='cancelada'){const r=L.reposedBy(CL().sessions,s.id);
    h+=`<label>Motivo</label><input value="${esc(s.motivo||'')}" data-c="sessF" data-k="motivo" placeholder="ex.: doença, feriado, sala ocupada">
    <div class="card" style="margin-top:12px">${r?`Reposta em <b>${fmtD(r.data)}</b> (${esc(r.ini||'')}) <button class="btn sm ghost" data-a="openSess" data-id="${r.id}">Abrir</button>`:`<b>Por repor.</b><button class="btn block" data-a="newRepo" data-from="${s.id}">Criar reposição</button>`}</div>`}
  else{const sug=L.suggestCode(cd,CL().sessions,s);
    h+=`<div class="grid2"><div><label>Plano de aula</label><input value="${esc(s.plano||'')}" placeholder="${esc(sug)}" data-c="sessF" data-k="plano" class="code"></div><div><label>&nbsp;</label><button class="btn ghost" style="width:100%" data-a="sessSug">Usar ${esc(sug)}</button></div></div>
    <label>Nota rápida</label><input value="${esc(s.nota||'')}" data-c="sessF" data-k="nota" placeholder="ex.: muito agitados, trocar o jogo">`;
    const pres=s.pres||{};const all=athsIn(k,s.turma,m);const extra=Object.keys(pres).filter(id=>!all.find(a=>a.id===id)&&ctx().athletes[id]).map(id=>ctx().athletes[id]);
    const exp=rep?[...all,...extra]:[...all.filter(a=>(L.enr(a,k).dias||[]).includes(wd)||pres[a.id]),...extra];const others=rep?[]:all.filter(a=>!exp.includes(a));
    const P=Object.values(pres).filter(v=>v==='P').length;
    h+=`<div class="ch" style="margin-top:14px"><h3>Presenças · ${P}</h3>${rep?'':'<button class="btn sm ghost" data-a="allP">Todos P</button>'}</div>`;
    const awS=Object.values(ctx().awards||{}).filter(x=>x.sess===s.id);const types=META().awardTypes||[];
    const row=a=>{const v=pres[a.id]||'';const mine=awS.filter(x=>x.ath===a.id);const pts=mine.reduce((t,x)=>t+(+x.pts||0),0);const op=UI.sess.aw===a.id;
      const awr=op?`<div class="awrow">${types.map(t=>`<button class="chip" data-a="sessAwAdd" data-id="${a.id}" data-t="${t.id}">${esc(t.nome)} +${t.pts}</button>`).join('')}${mine.map(x=>`<button class="chip on" data-a="sessAwDel" data-id="${x.id}">${esc(x.nome)} +${x.pts} ✕</button>`).join('')}</div>`:'';
      return `<div class="li"><div class="grow nm">${esc(nameOf(a))}${pts?` <span class="tag t-blue">+${pts}</span>`:''}</div><button class="star ${op?'on':''}" data-a="sessAw" data-id="${a.id}" aria-label="Prémio">★</button><div class="pfj">${(rep?['P']:['P','F','J']).map(x=>`<button class="m ${x} ${v===x?'on':''}" data-a="mark" data-id="${a.id}" data-s="${x}">${x}</button>`).join('')}</div></div>${awr}`};
    h+=exp.length?`<div class="list">${exp.map(row).join('')}</div>`:empty('Ninguém inscrito nesta turma.');
    if(others.length)h+=`<details><summary>Outros da turma (${others.length})</summary><div class="list">${others.map(row).join('')}</div></details>`;
    h+=`<p class="muted sm">${rep?'Na reposição só se registam presenças — quem não vem não leva falta.':'P presente · F falta · J justificada. Toca de novo para limpar. ★ atribui pontos extra (comportamento, desempenho…).'}</p>`}
  if(!s.virtual)h+=`<button class="btn danger block" data-a="sessDel">${rep?'Apagar esta aula':'Limpar registo desta aula'}</button>`;
  openSheet(h)}

function repoDraft(fromId,extra){const cd=CD();const sat=(()=>{let d=today();for(let i=0;i<7;i++){if(L.wdOf(d)===6)return d;d=L.addDays(d,1)}return d})();
  const pend=L.pendingCancelled(CL().sessions);const from=fromId?CL().sessions[fromId]:null;
  const turmas={},repoe={};for(const t of cd.turmas){turmas[t.id]=from?from.turma===t.id:!extra&&pend.some(p=>p.turma===t.id);repoe[t.id]=extra?'':(from&&from.turma===t.id?from.id:(pend.find(p=>p.turma===t.id)?.id||''))}
  if(!Object.values(turmas).some(Boolean))turmas[cd.turmas[0].id]=true;
  UI.draft={kind:'repo',data:extra?today():sat,ini:extra?'':'10:00',fim:extra?'':'11:00',turmas,repoe,extra:!!extra};UI.sheetLive=null;renderRepo()}
function renderRepo(){const d=UI.draft,cd=CD();const pend=L.pendingCancelled(CL().sessions);
  let h=shH(d.extra?'Aula extra':'Nova reposição')+`<div class="card"><div class="grid3"><div><label>Data</label><input type="date" value="${d.data}" data-i="dr" data-k="data"></div><div><label>Início</label><input type="time" value="${d.ini}" data-i="dr" data-k="ini"></div><div><label>Fim</label><input type="time" value="${d.fim}" data-i="dr" data-k="fim"></div></div>
   <label>Turmas</label><div class="chips">${cd.turmas.map(t=>`<button class="chip ${d.turmas[t.id]?'on':''}" data-a="repoT" data-t="${t.id}">${esc(t.nome)}</button>`).join('')}</div>`;
  for(const t of cd.turmas){if(!d.turmas[t.id])continue;const p=pend.filter(x=>x.turma===t.id);const cur=d.repoe[t.id]?CL().sessions[d.repoe[t.id]]:null;
    h+=`<label>${esc(t.nome)} — repõe a aula de</label><select data-c="repoS" data-t="${t.id}"><option value="">— nenhuma (aula extra) —</option>${[...p,...(cur&&!p.includes(cur)?[cur]:[])].map(x=>`<option value="${x.id}" ${d.repoe[t.id]===x.id?'selected':''}>${DOW[L.wdOf(x.data)]} ${fmtD(x.data)}${x.motivo?' · '+esc(x.motivo):''}</option>`).join('')}</select>`}
  h+=`<p class="muted sm">Uma reposição com várias turmas cria uma aula por turma, cada uma com o seu plano e as suas presenças. Aberta a toda a turma.</p></div><button class="btn block" data-a="saveRepo">Criar</button>`;openSheet(h)}

/* ---------- ATLETAS ---------- */
V.atletas=()=>{const u=UI.ath;return `<div class="row gap"><input placeholder="Procurar nome ou nº FNKP" value="${esc(u.q)}" data-i="athQ"><button class="btn" data-a="newAth">+ Novo</button></div>
  <div class="chips">${[['ins','Inscritos '+seasonLabel(K())],['out','Não inscritos'],['all','Todos']].map(([v,l])=>`<button class="chip ${u.f===v?'on':''}" data-a="athF" data-f="${v}">${l}</button>`).join('')}<button class="chip" data-a="importList">Importar lista</button></div><div id="athList">${athList()}</div>`};
function athList(){const u=UI.ath,k=K(),cd=CD(),q=u.q.trim().toLowerCase(),m=curMonth(k),cx=ctx();const st=L.attStats(cd,cx,L.seasonRange(k).from,L.seasonRange(k).to,+cd.cfg?.pesoJ||0.2);
  let as=Object.values(cx.athletes).filter(a=>{const e=L.enr(a,k);if(u.f==='ins'&&!e)return false;if(u.f==='out'&&e)return false;return !q||a.nome.toLowerCase().includes(q)||(a.curto||'').toLowerCase().includes(q)||String(a.fnkp||'').includes(q)}).sort((a,b)=>nameOf(a).localeCompare(nameOf(b)));
  if(!as.length)return empty(u.f==='ins'?'Ainda ninguém inscrito nesta época. Abre "Não inscritos" para inscrever quem continua, ou adiciona novos.':'Sem resultados.');
  const row=a=>{const e=L.enr(a,k);const x=st[a.id];const ag=a.nasc?L.ageAt(a.nasc,today()):null;
    const sub=e?[`${L.freqAt(e,m)}×/sem`,ag!=null?ag+' anos':'',x?.pct!=null?'assid. '+Math.round(x.pct*100)+'%':'',e.ate?'saiu '+mShort(e.ate):''].filter(Boolean).join(' · '):[ag!=null?ag+' anos':'',a.fnkp?'FNKP '+a.fnkp:''].filter(Boolean).join(' · ');
    let tag='';if(e&&cd.modelo==='gestao'){const s=L.monthStatus(cd,a,cx,k,m);tag=s?stTag(s):''}else if(!e)tag=`<button class="btn sm" data-a="quickEnr" data-id="${a.id}">Inscrever</button>`;
    return `<div class="li" data-a="editAth" data-id="${a.id}"><div class="grow"><div class="nm">${esc(nameOf(a))}${!a.fnkp?' <span class="tag t-warn" style="font-size:10px">FNKP?</span>':''}</div><div class="muted sm">${esc(sub)}</div></div>${tag}</div>`};
  if(u.f==='ins')return cd.turmas.map(t=>{const g=as.filter(a=>L.enr(a,k).turma===t.id);return g.length?`<div class="list"><div class="gh">${esc(t.nome)} · ${g.length}</div>${g.map(row).join('')}</div>`:''}).join('');
  return `<div class="list">${as.map(row).join('')}</div>`}
const ST={pago:['Pago','t-ok'],isento:['Isento','t-mut'],isentoFixo:['Isento fixo','t-mut'],semPres:['Sem presenças','t-mut'],falta:['Em falta','t-bad']};
const stTag=s=>`<span class="tag ${ST[s.st][1]}">${ST[s.st][0]}</span>`;
function newEnr(prev,k){const cd=CD();const t=prev?.turma||cd.turmas[0].id;const h=L.hist(cd.horarios,today())||cd.horarios?.[cd.horarios.length-1];
  const cur=[...new Set((h?.slots||[]).filter(s=>s.t===t).map(s=>+s.wd))].sort();let dias=cur;
  if(prev?.dias?.length&&cur.length){const out=[];for(const d of [...prev.dias].sort()){const c=cur.includes(d)?d:cur.filter(x=>!out.includes(x)).sort((a,b)=>Math.abs(a-d)-Math.abs(b-d))[0];if(c!=null&&!out.includes(c))out.push(c)}dias=out.sort()}const ep=cd.epocas[k];let desde=today().slice(0,7);if(ep?.meses?.length&&desde<ep.meses[0])desde=ep.meses[0];
  return{turma:t,dias,freq:[{desde,n:prev?L.freqAt(prev,'9999-12'):Math.min(2,dias.length||1)}],isento:!!prev?.isento,desde,ate:'',manual:[]}}
function athDraft(id){const k=K();const a=id?copy(ctx().athletes[id]):{id:'',fnkp:'',nome:'',nasc:'',curto:'',enc:'',tel:'',canal:'wa',notas:'',grau:'',irmaos:'',irmaoOutra:false,trazidoPor:'',insc:{}};
  a.insc=a.insc||{};if(!id)a.insc[k]=newEnr(null,k);UI.draft={kind:'ath',isNew:!id,a};UI.sheetLive=null;renderAth()}
function renderAth(){const{a,isNew}=UI.draft,k=K(),cd=CD(),cx=ctx(),M=META(),e=a.insc[k]||null,m=curMonth(k);
  const groups=[...new Set(Object.values(cx.athletes).map(x=>x.irmaos).filter(Boolean))];
  let h=shH(isNew?'Novo atleta':esc(nameOf(a)))+`<div class="card"><label>Nome completo</label><input value="${esc(a.nome)}" data-i="af" data-k="nome">
  <div class="grid2"><div><label>Nome curto</label><input value="${esc(a.curto)}" placeholder="${esc(L.shortName(a.nome))}" data-i="af" data-k="curto"></div><div><label>Nº FNKP</label><input value="${esc(a.fnkp)}" data-i="af" data-k="fnkp" inputmode="numeric"></div>
  <div><label>Nascimento</label><input type="date" value="${esc(a.nasc)}" data-c="af" data-k="nasc"></div><div><label>Idade / escalão</label><div class="ro">${a.nasc?L.ageAt(a.nasc,today())+' anos · '+L.escalao(a.nasc,k):'—'}</div></div>
  <div><label>Encarregado / contacto</label><input value="${esc(a.enc)}" data-i="af" data-k="enc"></div><div><label>Telemóvel</label><input value="${esc(a.tel)}" data-i="af" data-k="tel" inputmode="tel"></div></div>
  <label>Mensagens por</label><div class="chips">${[['wa','WhatsApp'],['sms','SMS']].map(([v,l])=>`<button class="chip ${(a.canal||'wa')===v?'on':''}" data-a="afCanal" data-v="${v}">${l}</button>`).join('')}${a.tel&&!isNew?`<button class="chip" data-a="contact">Contactar</button>`:''}</div>
  <div class="grid2"><div><label>Irmãos no karaté (família)</label><input value="${esc(a.irmaos)}" list="grps" data-i="af" data-k="irmaos" placeholder="ex.: Saavedra"><datalist id="grps">${groups.map(g=>`<option>${esc(g)}</option>`).join('')}</datalist></div>
  <div><label>Irmão noutra modalidade</label><button class="chip ${a.irmaoOutra?'on':''}" style="width:100%;padding:9px" data-a="afTog" data-k="irmaoOutra">${a.irmaoOutra?'Sim':'Não'}</button></div></div>
  <label>Trazido por (traz um amigo)</label><select data-c="af" data-k="trazidoPor"><option value="">—</option>${Object.values(cx.athletes).filter(x=>x.id!==a.id).sort((x,y)=>nameOf(x).localeCompare(nameOf(y))).map(x=>`<option value="${x.id}" ${a.trazidoPor===x.id?'selected':''}>${esc(nameOf(x))}</option>`).join('')}</select>
  <label>Graduação</label><select data-c="af" data-k="grau"><option value="">—</option>${(M.graus||[]).map(g=>`<option ${a.grau===g?'selected':''}>${esc(g)}</option>`).join('')}</select>
  <label>Notas</label><textarea data-i="af" data-k="notas">${esc(a.notas)}</textarea></div>`;
  h+=`<div class="card"><div class="ch"><h3>Inscrição ${seasonLabel(k)}</h3><button class="chip ${e?'on':''}" data-a="togEnr">${e?'Inscrito':'Não inscrito'}</button></div>`;
  if(e){h+=`<div class="seg">${cd.turmas.map(t=>`<button class="${e.turma===t.id?'on':''}" data-a="eTurma" data-t="${t.id}">${esc(t.nome)}</button>`).join('')}</div>
    <label>Dias habituais</label><div class="chips">${[1,2,3,4,5,6].map(w=>`<button class="chip ${(e.dias||[]).includes(w)?'on':''}" data-a="eDia" data-w="${w}">${DOW[w]}</button>`).join('')}</div>
    <div class="grid2"><div><label>Desde (mês)</label><input type="month" value="${e.desde||''}" data-c="ef" data-k="desde"></div><div><label>Saiu / desistiu em</label><input type="month" value="${e.ate||''}" data-c="ef" data-k="ate"></div></div>`;
    if(cd.modelo==='gestao'){h+=`<label>Frequência (só muda a pedido)</label>${(e.freq||[]).slice().sort((x,y)=>x.desde<y.desde?-1:1).map((f,i)=>`<div class="srow"><span>desde ${mLabel(f.desde)}</span><b>${f.n}×/semana</b>${e.freq.length>1?`<button class="x" data-a="rmFreq" data-d="${f.desde}">×</button>`:''}</div>`).join('')}
      <div class="row gap" style="margin-top:6px"><select id="nfN" style="width:auto">${[1,2,3].map(n=>`<option value="${n}">${n}×/semana</option>`).join('')}</select><input type="month" id="nfM" value="${L.addMonths(today().slice(0,7),1)}"><button class="btn sm" data-a="addFreq">Mudar</button></div>
      <div class="grid2"><div><label>Isento de mensalidade</label><button class="chip ${e.isento?'on':''}" style="width:100%;padding:9px" data-a="eIsento">${e.isento?'Sim':'Não'}</button></div><div></div></div>
      <label>Valor especial (sobrepõe-se às regras)</label>${(e.manual||[]).map(x=>`<div class="srow"><span>desde ${mLabel(x.desde)} · ${esc(x.nota||'')}</span><b>${x.v===''?'regras':eur(x.v)}</b><button class="x" data-a="rmMan" data-d="${x.desde}">×</button></div>`).join('')}
      <details><summary>Definir valor especial</summary><div class="row gap"><input type="month" id="vmM" value="${today().slice(0,7)}"><input type="number" step="0.5" id="vmV" placeholder="€" style="width:80px"></div><div class="row gap" style="margin-top:6px"><input id="vmN" placeholder="Motivo"><button class="btn sm" data-a="addMan">OK</button></div><p class="muted sm">Para voltar às regras a partir de um mês, define um valor vazio.</p></details>`;
      if(!isNew&&cx.athletes[a.id]){const v=L.monthValue(cd,a,cx,k,m);h+=`<p class="sm" style="margin-top:10px">Valor em ${mShort(m).toLowerCase()}: <b>${eur(v.v)}</b>${v.desc.length?' <span class="muted">('+eur(v.base)+' '+v.desc.map(x=>'− '+x[1]+' '+x[0].toLowerCase()).join(' ')+(v.descTot<v.desc.reduce((s,x)=>s+x[1],0)?', máx. '+eur(v.descTot):'')+')</span>':''}${v.manual?' <span class="muted">('+esc(v.manual)+')</span>':''}</p>
        <div class="mgrid">${(cd.epocas[k].meses||[]).map(mm=>{const s=L.monthStatus(cd,a,cx,k,mm);if(!s)return `<div class="mcell t-mut">${mShort(mm)}<br>—</div>`;const c={pago:'t-ok',falta:mm<=today().slice(0,7)?'t-bad':'t-mut',isento:'t-mut',isentoFixo:'t-mut',semPres:'t-mut'}[s.st];
          return `<div class="mcell ${c}">${mShort(mm)}<br>${s.st==='pago'?'✓ '+s.v:s.st==='falta'?s.v+'€':s.st==='semPres'?'s/ pres.':'isento'}</div>`}).join('')}</div>`}}}
  h+='</div>';
  if(!isNew&&cx.athletes[a.id]){const fees=Object.values(cx.fees).filter(f=>f.ath===a.id).sort((x,y)=>x.ano<y.ano?1:-1);const evs=Object.values(cx.events).filter(ev=>ev.atl?.[a.id]).sort((x,y)=>x.data<y.data?1:-1);
    if(fees.length||evs.length)h+=`<div class="card"><h3>Quotas e taxas</h3>${fees.map(f=>`<div class="srow"><span>${L.QITEMS.find(q=>q[0]===f.item)[1]} ${f.ano}${f.red?' (red.)':''}</span><span>${eur(L.feeValue(M,f,a,today()))}</span>${feeTag(f.estado)}</div>`).join('')}${evs.map(ev=>`<div class="srow"><span>${esc(ev.nome)} · ${fmtD(ev.data)}${ev.atl[a.id].grau?' · '+esc(ev.atl[a.id].grau):''}</span><span>${eur(ev.atl[a.id].v??ev.valor)}</span>${feeTag(ev.atl[a.id].estado)}</div>`).join('')}</div>`;
    const pts=L.pointsTable(cd,cx,M,k,'E')[a.id];const rows=Object.keys(cd.epocas).sort().reverse().map(sk=>{const r=L.seasonRange(sk);const x=L.attStats(cd,cx,r.from,r.to,+cd.cfg?.pesoJ||0.2)[a.id];return x?`<div class="srow"><span>${seasonLabel(sk)}</span><span class="muted sm">${x.P} P · ${x.J} J de ${L.fmtNum(x.exp,x.exp%1?1:0)} previstas</span><b>${Math.round(x.pct*100)}%</b></div>`:''}).join('');
    h+=`<div class="card"><h3>Assiduidade e pontos</h3>${rows||'<div class="muted sm">Sem registos.</div>'}${pts?`<div class="srow"><span>Pontos ${seasonLabel(k)}</span><span class="muted sm">assid. ${pts.assid} · prémios ${pts.prem} · eventos ${pts.ev}</span><b>${pts.tot}</b></div>`:''}</div>`;
    const charts=(M.tests||[]).map(t=>{const hs=L.testHistory(cx.tests,a.id,t.id).map(x=>({d:x.data,v:L.bestOf(t,x.r)})).filter(x=>x.v!=null);return hs.length?`<div class="tchart"><div class="sm"><b>${esc(t.nome)}</b> <span class="muted">${esc(t.un)}</span></div>${spark(hs,t)}</div>`:''}).join('');
    if(charts)h+=`<div class="card"><h3>Testes físicos</h3>${charts}</div>`}
  h+=`<button class="btn block" data-a="saveAth">Guardar</button>${isNew?'':'<button class="btn danger block" data-a="delAth">Apagar atleta</button>'}`;
  const b=$('#sheetBody'),sc=b.scrollTop;openSheet(h);b.scrollTop=sc}
const feeTag=s=>`<span class="tag ${s==='entregue'?'t-ok':s==='cobrado'?'t-blue':'t-bad'}">${s==='entregue'?'Entregue':s==='cobrado'?'Cobrado':'Em falta'}</span>`;
function spark(pts,t){const W=300,H=70,P=16;const vs=pts.map(p=>p.v);let mn=Math.min(...vs),mx=Math.max(...vs);if(mn===mx){mn-=1;mx+=1}
  const x=i=>pts.length===1?W/2:P+i*(W-2*P)/(pts.length-1),y=v=>{const r=(v-mn)/(mx-mn);return t.melhor==='min'?P+r*(H-2*P):H-P-r*(H-2*P)};
  return `<svg viewBox="0 0 ${W} ${H+14}" class="spark"><polyline fill="none" stroke="var(--accent)" stroke-width="2" points="${pts.map((p,i)=>x(i)+','+y(p.v)).join(' ')}"/>${pts.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.v)}" r="3.5" fill="var(--accent)"/><text x="${x(i)}" y="${y(p.v)-7}" text-anchor="middle" font-size="10" fill="currentColor">${L.fmtNum(p.v,t.dec)}</text><text x="${x(i)}" y="${H+12}" text-anchor="middle" font-size="9" fill="var(--muted)">${fmtD(p.d).slice(0,5)}</text>`).join('')}</svg>`}

function importSheet(){UI.draft={kind:'imp',text:'',turma:CD().turmas[0].id};UI.sheetLive=null;renderImp()}
function renderImp(){const d=UI.draft,rows=L.parseAthleteList(d.text);
  openSheet(shH('Importar lista')+`<div class="card"><p class="sm">Cola uma linha por atleta: <b>nome; data de nascimento; nº FNKP</b>. Também funciona com colunas copiadas do Excel. Data como 03/04/2016.</p>
  <textarea data-i="impT" style="min-height:160px" placeholder="João Silva; 03/04/2016; 99123">${esc(d.text)}</textarea>
  <label>Inscrever na turma (${seasonLabel(K())})</label><div class="seg">${CD().turmas.map(t=>`<button class="${d.turma===t.id?'on':''}" data-a="impTurma" data-t="${t.id}">${esc(t.nome)}</button>`).join('')}</div>
  <div id="impPrev" class="muted sm">${rows.length} atleta(s) reconhecido(s)</div></div><button class="btn block" data-a="doImport">Importar</button>`)}

/* ---------- CONTAS ---------- */
V.contas=()=>{const cd=CD();const opts=cd.modelo==='gestao'?[['mens','Mensalidades'],['poup',cd.cfg?.poupNome||'Poupança'],['quotas','Quotas e taxas']]:[['rem','Remuneração'],['quotas','Quotas e taxas']];
  if(!opts.find(o=>o[0]===UI.con.v))UI.con.v=opts[0][0];
  return `<div class="seg">${opts.map(([v,l])=>`<button class="${UI.con.v===v?'on':''}" data-a="conV" data-v="${v}">${esc(l)}</button>`).join('')}</div>`+CV[UI.con.v]()};
const CV={};
CV.mens=()=>{const cd=CD(),k=K(),cx=ctx(),ep=cd.epocas[k];if(!UI.con.m||!ep.meses.includes(UI.con.m))UI.con.m=curMonth(k);const m=UI.con.m;const f=L.finGestao(cd,cx,k,m);const en=esc(cd.cfg?.entNome||'Espaço');
  let h=`<select data-c="conM">${ep.meses.map(x=>`<option value="${x}" ${x===m?'selected':''}>${mLabel(x)}</option>`).join('')}</select>
  <div class="kpis" style="margin-top:10px"><div class="kpi"><small>Recebido</small><b>${eur(f.rec)}</b></div><div class="kpi"><small>Em falta até ${mShort(m)}</small><b style="color:${f.due?'var(--bad)':'inherit'}">${eur(f.due)}</b></div>
  <div class="kpi"><small>Pagar ${en} (${f.pct}%)</small><b>${eur(f.ent)}</b><small>c/ em falta ${eur(f.ent+f.dueEnt)}</small></div><div class="kpi"><small>Treinador</small><b>${eur(f.tr)}</b><small>c/ em falta ${eur(f.tr+f.dueTr)}</small></div></div>`;
  const as=Object.values(cx.athletes).map(a=>({a,s:L.monthStatus(cd,a,cx,k,m)})).filter(x=>x.s).sort((x,y)=>nameOf(x.a).localeCompare(nameOf(y.a)));
  const paid=as.filter(x=>x.s.st==='pago').length,toPay=as.filter(x=>['pago','falta'].includes(x.s.st)).length;
  h+=`<div class="ch"><h3>${mLabel(m)}</h3><span class="muted sm">${paid} pagos de ${toPay}</span></div>`;
  h+=as.length?`<div class="list">${as.map(({a,s})=>{const sub=s.st==='pago'?`${eur(s.v)}${s.d?' · '+fmtD(s.d):''}`:s.v!=null?`${eur(s.v)}${s.val?.desc?.length?' · '+s.val.desc.map(x=>x[0]).join(', ').toLowerCase():''}`:'';
    return `<div class="li"><div class="grow"><div class="nm">${esc(nameOf(a))}</div><div class="muted sm" ${s.st==='pago'?`data-a="payVal" data-id="${a.id}" data-m="${m}"`:''}>${sub}</div></div>${s.st==='pago'?`<button class="btn sm ghost" data-a="payMsg" data-id="${a.id}" data-m="${m}" aria-label="Enviar confirmação">✉</button>`:''}<button class="tag ${ST[s.st][1]}" style="padding:7px 11px" data-a="payCycle" data-id="${a.id}" data-m="${m}">${ST[s.st][0]}</button></div>`}).join('')}</div>`:empty('Sem atletas inscritos neste mês.');
  h+=`<p class="muted sm">Toca no estado: Em falta → Pago → Isento. Quem não teve nenhuma presença no mês fica “Sem presenças” e não paga. ✉ envia a confirmação ao encarregado.</p>`;
  const due=L.dueList(cd,cx,k,m).filter(x=>x.m!==m);const g={};due.forEach(x=>(g[x.id]=g[x.id]||[]).push(x));
  if(Object.keys(g).length)h+=`<h3 style="margin:16px 0 8px">Em atraso de meses anteriores</h3><div class="list">${Object.keys(g).map(id=>`<div class="li"><div class="grow"><div class="nm">${esc(N(id))}</div><div class="muted sm">${g[id].map(x=>mShort(x.m)).join(', ')} · ${eur(g[id].reduce((s,x)=>s+x.v,0))}</div></div><button class="btn sm ghost" data-a="remind" data-id="${id}">Lembrar</button></div>`).join('')}</div>`;
  return h};
CV.poup=()=>{const cd=CD(),k=K(),p=L.poupanca(cd,ctx(),k);
  let h=`<div class="kpis"><div class="kpi"><small>Saldo</small><b>${eur(p.saldo)}</b><small>início da época ${eur(p.ini)}</small></div><div class="kpi"><small>Entradas (${eur(+L.hist(cd.cfg.poupMensal,today().slice(0,7))?.v||0)}/mês)</small><b>${eur(p.ent)}</b></div>
   <div class="kpi"><small>Saídas</small><b>${eur(p.said+p.reemb)}</b></div><div class="kpi"><small>A reembolsar-te</small><b style="color:${p.pend>0?'var(--warn)':'inherit'}">${eur(p.pend)}</b></div></div>
   <button class="btn block" data-a="newMov">+ Movimento</button>`;
  const lab={saida:['Saída','t-bad'],pessoal:['Paguei eu','t-warn'],reembolso:['Reembolso','t-blue'],ajuste:['Ajuste','t-mut']};
  h+=p.movs.length?`<div class="list" style="margin-top:12px">${p.movs.map(x=>`<div class="li" data-a="editMov" data-id="${x.id}"><div class="grow"><div class="nm">${esc(x.desc||'—')}</div><div class="muted sm">${fmtD(x.data)}${x.cat?' · '+esc(x.cat):''}</div></div><b>${eur(x.v)}</b><span class="tag ${lab[x.tipo][1]}">${lab[x.tipo][0]}</span></div>`).join('')}</div>`:empty('Sem movimentos nesta época.');
  h+=`<p class="muted sm">As entradas mensais são automáticas nos meses com recebimentos. “Paguei eu” regista uma despesa paga do teu bolso: fica a reembolsar até registares o reembolso.</p>`;return h};
CV.rem=()=>{const cd=CD(),k=K(),cx=ctx(),ep=cd.epocas[k];const cfg=cd.cfg||{};const now=today().slice(0,7);
  let h=`<div class="seg"><button class="${cfg.modeloPag!=='aula'?'on':''}" data-a="modPag" data-v="aluno">Por aluno · ${eur(cfg.valorAluno)}</button><button class="${cfg.modeloPag==='aula'?'on':''}" data-a="modPag" data-v="aula">Por aula · ${eur(cfg.valorAula)}</button></div>`;
  let tp=0,tr=0,ta=0,tl=0;const rows=ep.meses.filter(m=>m<=L.addMonths(now,1)).reverse().map(m=>{const x=L.profMonth(cd,cx,k,m);tp+=x.prev;ta+=x.porAluno;tl+=x.porAula;if(x.rec!=null)tr+=x.rec;
    return `<div class="card"><div class="ch"><h3>${mLabel(m)}</h3><span class="muted sm">${x.ativos} alunos · ${x.aulas} aulas</span></div>
    <div class="srow"><span class="${cfg.modeloPag!=='aula'?'':'muted'}">Por aluno</span><b class="${cfg.modeloPag!=='aula'?'':'muted'}">${eur(x.porAluno)}</b></div><div class="srow"><span class="${cfg.modeloPag==='aula'?'':'muted'}">Por aula</span><b class="${cfg.modeloPag==='aula'?'':'muted'}">${eur(x.porAula)}</b></div>
    <div class="srow"><span>Recebido${x.recD?' <span class="muted sm">'+fmtD(x.recD)+'</span>':''}${x.nota?' <span class="muted sm">· '+esc(x.nota)+'</span>':''}</span>${x.rec!=null?`<b>${eur(x.rec)}</b>`:''}<button class="btn sm ${x.rec!=null?'ghost':''}" data-a="recReg" data-m="${m}">${x.rec!=null?'Corrigir':'Registar'}</button></div>
    ${x.dif!=null&&x.dif!==0?`<div class="srow"><span>Diferença</span><b style="color:${x.dif<0?'var(--bad)':'var(--ok)'}">${x.dif>0?'+':''}${eur(x.dif)}</b></div>`:''}</div>`});
  h+=`<div class="kpis"><div class="kpi"><small>Previsto na época</small><b>${eur(tp)}</b></div><div class="kpi"><small>Recebido</small><b>${eur(tr)}</b></div><div class="kpi"><small>Total por aluno</small><b>${eur(ta)}</b></div><div class="kpi"><small>Total por aula</small><b>${eur(tl)}</b></div></div>`+rows.join('');
  h+=`<p class="muted sm">Alunos ativos = inscritos que não desistiram. O ginásio pode não pagar alunos C.A.D.D.i que faltem — a diferença mostra isso.</p>`;return h};
CV.quotas=()=>{const cx=ctx(),M=META(),t=today(),ms=L.moneySummary(M,cx,t);
  let h=`<div class="kpis"><div class="kpi"><small>Por cobrar</small><b style="color:${ms.falta?'var(--bad)':'inherit'}">${eur(ms.falta)}</b></div><div class="kpi"><small>Em mão (não é teu)</small><b style="color:${ms.mao?'var(--warn)':'inherit'}">${eur(ms.mao)}</b></div></div>
   <div class="chips"><button class="chip ${UI.con.qv==='quotas'?'on':''}" data-a="qv" data-v="quotas">Quotas anuais</button><button class="chip ${UI.con.qv==='ev'?'on':''}" data-a="qv" data-v="ev">Estágios, exames, cintos</button></div>`;
  if(UI.con.qv==='quotas'){const ys=[...new Set([...Object.values(cx.fees).map(f=>f.ano),t.slice(0,4),...(+t.slice(5,7)>=10?[String(+t.slice(0,4)+1)]:[])])].sort();if(!UI.con.qa||!ys.includes(UI.con.qa))UI.con.qa=+t.slice(5,7)>=10?String(+t.slice(0,4)+1):t.slice(0,4);const Y=UI.con.qa;
    h+=`<div class="row gap"><select data-c="qa" class="grow">${ys.map(y=>`<option ${y===Y?'selected':''}>${y}</option>`).join('')}</select><button class="btn" data-a="genQuotas" data-y="${Y}">Gerar ${Y}</button></div>`;
    if(!M.quotas?.[Y]||!Object.values(M.quotas[Y]).some(x=>+x.norm))h+=`<div class="card banner sm" style="margin-top:10px">Os valores das quotas de ${Y} ainda não estão definidos. <button class="btn sm ghost" data-a="tab" data-t="geral">Definir valores</button></div>`;
    const fees=Object.values(cx.fees).filter(f=>f.ano===Y);const by={};fees.forEach(f=>(by[f.ath]=by[f.ath]||{})[f.item]=f);
    const ids=Object.keys(by).sort((a,b)=>N(a).localeCompare(N(b)));
    h+=ids.length?`<div class="list" style="margin-top:10px">${ids.map(id=>{const a=cx.athletes[id];const any=Object.values(by[id]).some(f=>f.estado==='cobrado');
      return `<div class="li"><div class="grow"><div class="nm">${esc(N(id))}</div><div class="qchips">${L.QITEMS.map(([it,l])=>{const f=by[id][it];if(!f)return '';return `<button class="tag ${f.estado==='entregue'?'t-ok':f.estado==='cobrado'?'t-blue':'t-bad'}" data-a="feeCycle" data-id="${f.id}">${l.slice(0,3)}${f.red?'·r':''} ${L.fmtNum(L.feeValue(M,f,a,t),2)}€</button>`}).join('')}</div></div>${any?`<button class="btn sm ghost" data-a="feeMsg" data-id="${id}" data-y="${Y}">✉</button>`:''}</div>`}).join('')}</div>
      <button class="btn ghost block" data-a="deliverAll" data-y="${Y}">Marcar todos os cobrados como entregues</button>`:empty(`Sem quotas de ${Y}. Usa “Gerar ${Y}” para criar as quotas dos atletas inscritos.`);
    h+=`<p class="muted sm">Toca em cada quota: Em falta → Cobrado → Entregue. Infantil até aos 9 anos (idade no dia da cobrança). “r” = valor reduzido de quem entrou entre setembro e dezembro.</p>`}
  else{const evs=Object.values(cx.events).sort((a,b)=>a.data<b.data?1:-1);
    h+=`<button class="btn block" data-a="newEv">+ Nova ocorrência</button>`+(evs.length?`<div class="list" style="margin-top:12px">${evs.map(ev=>{const at=Object.values(ev.atl||{});const cob=at.filter(x=>x.estado!=='falta').length;
      return `<div class="li" data-a="editEv" data-id="${ev.id}"><div class="grow"><div class="nm">${esc(ev.nome)}</div><div class="muted sm">${fmtD(ev.data)} · ${at.length} atletas · ${eur(ev.valor)}${ev.pontos?' · '+ev.pontos+' pts':''}</div></div><span class="tag ${cob===at.length?'t-ok':'t-warn'}">${cob}/${at.length}</span></div>`}).join('')}</div>`:empty('Sem ocorrências.'))}
  return h};
function evDraft(id){const ev=id?copy(ctx().events[id]):{id:'',nome:'',tipo:'estagio',data:today(),valor:'',pontos:5,atl:{}};UI.draft={kind:'ev',isNew:!id,ev};UI.sheetLive=null;renderEv()}
function renderEv(){const{ev,isNew}=UI.draft,k=K(),M=META();const as=athsIn(k,'',curMonth(k));const tipos=[['jornada','Jornada técnica'],['estagio','Estágio'],['exame','Exame de graduação'],['cintos','Cintos'],['prova','Prova / torneio'],['outro','Outro']];const others=Object.values(DB.clubs).filter(c=>c.doc&&c.doc.id!==UI.club);
  let h=shH(isNew?'Nova ocorrência':'Ocorrência')+`<div class="card"><label>Nome</label><input value="${esc(ev.nome)}" data-i="evf" data-k="nome" placeholder="ex.: Estágio Nacional Porto">
  <div class="grid2"><div><label>Tipo</label><select data-c="evf" data-k="tipo">${tipos.map(([v,l])=>`<option value="${v}" ${ev.tipo===v?'selected':''}>${l}</option>`).join('')}</select></div><div><label>Data</label><input type="date" value="${ev.data}" data-c="evf" data-k="data"></div>
  <div><label>Valor por atleta (€)</label><input type="number" step="0.5" value="${ev.valor}" data-i="evf" data-k="valor"></div><div><label>Pontos de participação</label><input type="number" value="${ev.pontos}" data-i="evf" data-k="pontos"></div></div>
  <label>Local</label><input value="${esc(ev.local||'')}" data-i="evf" data-k="local" placeholder="ex.: Pombal">
  <label>Horário (uma linha por sessão: descrição; hora)</label><textarea data-i="evf" data-k="horario" placeholder="Tradicional (Jovens e Adultos); 10h00 – 13h00&#10;Karaté Games – Lúdico (Crianças); 15h00 – 17h00">${esc(ev.horario||'')}</textarea>
  ${isNew&&others.length?`<label>Criar também em</label><div class="chips">${others.map(c=>`<button class="chip ${UI.draft.also?.[c.doc.id]?'on':''}" data-a="evAlso" data-id="${c.doc.id}">${esc(c.doc.nome)}</button>`).join('')}</div>`:''}</div>
  <h3 style="margin:12px 0 6px">Atletas · ${Object.keys(ev.atl).length}</h3><div class="chips">${as.map(a=>`<button class="chip ${ev.atl[a.id]?'on':''}" data-a="evAth" data-id="${a.id}">${esc(nameOf(a))}</button>`).join('')}</div>`;
  const sel=Object.keys(ev.atl);if(sel.length)h+=`<div class="list">${sel.sort((a,b)=>N(a).localeCompare(N(b))).map(id=>{const x=ev.atl[id];return `<div class="li"><div class="grow nm">${esc(N(id))}</div>${ev.tipo==='exame'?`<select data-c="evGrau" data-id="${id}" style="width:auto">${['',...(M.graus||[])].map(g=>`<option ${x.grau===g?'selected':''}>${esc(g)}</option>`).join('')}</select>`:''}${+ev.valor?`<button class="tag ${x.estado==='entregue'?'t-ok':x.estado==='cobrado'?'t-blue':'t-bad'}" data-a="evCycle" data-id="${id}">${x.estado==='entregue'?'Entregue':x.estado==='cobrado'?'Cobrado':'Em falta'}</button>`:''}</div>`}).join('')}</div>`;
  if(ev.tipo==='exame')h+=`<p class="muted sm">No exame, o grau escolhido passa a ser a graduação do atleta ao guardar.</p>`;
  h+=`<button class="btn block" data-a="saveEv">Guardar</button>${isNew?'':'<button class="btn danger block" data-a="delEv">Apagar</button>'}`;
  const b=$('#sheetBody'),sc=b.scrollTop;openSheet(h);b.scrollTop=sc}
function movDraft(id){const x=id?copy(ctx().ledger[id]):{id:'',tipo:'saida',data:today(),desc:'',cat:'Material',v:''};UI.draft={kind:'mov',isNew:!id,x};UI.sheetLive=null;renderMov()}
function renderMov(){const{x,isNew}=UI.draft;const tipos=[['saida','Saída da poupança'],['pessoal','Paguei eu (a reembolsar)'],['reembolso','Reembolso para mim'],['ajuste','Ajuste (+/−)']];
  openSheet(shH(isNew?'Novo movimento':'Movimento')+`<div class="card"><label>Tipo</label><div class="chips">${tipos.map(([v,l])=>`<button class="chip ${x.tipo===v?'on':''}" data-a="movT" data-v="${v}">${l}</button>`).join('')}</div>
  <div class="grid2"><div><label>Data</label><input type="date" value="${x.data}" data-i="mv" data-k="data"></div><div><label>Valor (€)</label><input type="number" step="0.01" value="${x.v}" data-i="mv" data-k="v"></div></div>
  <label>Descrição</label><input value="${esc(x.desc)}" data-i="mv" data-k="desc" placeholder="ex.: luvas de kumite"><label>Categoria</label><input value="${esc(x.cat)}" list="cats" data-i="mv" data-k="cat"><datalist id="cats">${['Material','Equipamento','Eventos','Limpeza','Outros'].map(c=>`<option>${c}</option>`).join('')}</datalist></div>
  <button class="btn block" data-a="saveMov">Guardar</button>${isNew?'':'<button class="btn danger block" data-a="delMov">Apagar</button>'}`)}

/* ---------- MAIS ---------- */
V.mais=()=>{const items=[['premios','🏅','Prémios e pontos','Classificações trimestrais e de época por turma'],['testes','⏱','Testes físicos','Registo com cronómetro, progressão e impressão A4'],['aniv','🎂','Aniversários','Exportar para o calendário do telemóvel'],
  ['config','⚙️','Definições do clube','Turmas, horários, épocas, valores e descontos'],['geral','🧩','Definições gerais','Quotas por ano, pontos, testes, graus e mensagens'],['dados','💾','Dados e backup','Exportar, importar, CSV']];
  return `<div class="list">${items.map(([t,i,l,s])=>`<div class="li" data-a="tab" data-t="${t}"><span style="font-size:22px">${i}</span><div class="grow"><div class="nm">${l}</div><div class="muted sm">${s}</div></div><span class="muted">›</span></div>`).join('')}</div>
  <p class="muted sm" style="text-align:center">${esc(DB.user.email)}${DB.mode==='demo'?' (demo)':''} · <a href="#" data-a="logout">Sair</a></p>`};

V.premios=()=>{const cd=CD(),k=K(),cx=ctx(),M=META();if(!UI.pre.t){const mo=+today().slice(5,7);UI.pre.t=mo>=9?'T1':mo<=3?'T2':'T3'}const t=UI.pre.t;
  const tab=L.pointsTable(cd,cx,M,k,t);
  let h=back('Prémios e pontos')+`<div class="seg">${[...L.TRIM.map(x=>[x[0],x[0]]),['E','Época']].map(([v,l])=>`<button class="${t===v?'on':''}" data-a="preT" data-t="${v}">${l}</button>`).join('')}</div><button class="btn block" data-a="newAward">+ Atribuir pontos</button>`;
  for(const tu of cd.turmas){const rows=Object.values(tab).filter(x=>x.turma===tu.id).sort((a,b)=>b.tot-a.tot||nameOf(cx.athletes[a.id]).localeCompare(nameOf(cx.athletes[b.id])));if(!rows.length)continue;
    h+=`<div class="list" style="margin-top:12px"><div class="gh">${esc(tu.nome)}</div>${rows.map((x,i)=>`<div class="li" data-a="editAth" data-id="${x.id}"><span class="rank">${['🥇','🥈','🥉'][i]&&x.tot>0?['🥇','🥈','🥉'][i]:i+1}</span><div class="grow"><div class="nm">${esc(N(x.id))}</div><div class="muted sm">assid. ${x.pct!=null?Math.round(x.pct*100)+'% → ':''}${x.assid} · prémios ${x.prem} · eventos ${x.ev}</div></div><b>${x.tot}</b></div>`).join('')}</div>`}
  const r=L.trimRange(k,t);const aw=Object.values(cx.awards).filter(x=>x.data>=r.from&&x.data<=r.to).sort((a,b)=>a.data<b.data?1:-1);
  if(aw.length)h+=`<details><summary>Pontos atribuídos neste período (${aw.length})</summary><div class="list">${aw.map(x=>`<div class="li"><div class="grow"><div class="nm">${esc(N(x.ath))} · ${esc(x.nome)}</div><div class="muted sm">${fmtD(x.data)}${x.nota?' · '+esc(x.nota):''}</div></div><b>+${x.pts}</b><button class="x" data-a="delAward" data-id="${x.id}">×</button></div>`).join('')}</div></details>`;
  h+=`<p class="muted sm">Assiduidade por trimestre: ${(M.assidTiers||[]).map(x=>`≥${x.min}% = ${x.pts}`).join(' · ')} pts. A época soma os três trimestres.</p>`;return h};
function awardDraft(){const M=META();const ty=M.awardTypes?.[0]||{id:'',nome:'',pts:5};UI.draft={kind:'aw',tipo:ty.id,pts:ty.pts,data:today(),turma:CD().turmas[0].id,sel:{},nota:''};UI.sheetLive=null;renderAward()}
function renderAward(){const d=UI.draft,M=META(),k=K();const as=athsIn(k,d.turma,curMonth(k));
  openSheet(shH('Atribuir pontos')+`<div class="card"><label>Tipo</label><div class="chips">${(M.awardTypes||[]).map(t=>`<button class="chip ${d.tipo===t.id?'on':''}" data-a="awT" data-id="${t.id}">${esc(t.nome)} · ${t.pts}</button>`).join('')}</div>
  <div class="grid2"><div><label>Pontos</label><input type="number" value="${d.pts}" data-i="awf" data-k="pts"></div><div><label>Data</label><input type="date" value="${d.data}" data-i="awf" data-k="data"></div></div>
  <label>Nota</label><input value="${esc(d.nota)}" data-i="awf" data-k="nota"></div>
  <div class="seg">${CD().turmas.map(t=>`<button class="${d.turma===t.id?'on':''}" data-a="awTurma" data-t="${t.id}">${esc(t.nome)}</button>`).join('')}</div>
  <div class="chips">${as.map(a=>`<button class="chip ${d.sel[a.id]?'on':''}" data-a="awAth" data-id="${a.id}">${esc(nameOf(a))}</button>`).join('')}</div>
  <button class="btn block" data-a="saveAward">Atribuir a ${Object.keys(d.sel).filter(x=>d.sel[x]).length} atleta(s)</button>`)}

/* ---------- TESTES ---------- */
V.testes=()=>{const cx=ctx();const ss=Object.values(cx.tests).sort((a,b)=>a.data<b.data?1:-1);const M=META();
  return back('Testes físicos')+`<button class="btn block" data-a="newTest">+ Sessão de testes</button>`+(ss.length?`<div class="list" style="margin-top:12px">${ss.map(s=>{const n=Object.keys(s.res||{}).length;return `<div class="li" data-a="openTest" data-id="${s.id}"><div class="grow"><div class="nm">${fmtD(s.data)} · ${(s.turmas||[]).map(t=>turma(t).nome).join(' + ')}</div><div class="muted sm">${(s.testes||[]).map(id=>M.tests.find(t=>t.id===id)?.nome||id).join(', ')}</div></div><span class="tag t-mut">${n} atl.</span></div>`}).join('')}</div>`:empty('Sem sessões de testes.'))};
function newTest(){const M=META();const id='t'+uid();const s={id,data:today(),turmas:CD().turmas.map(t=>t.id),testes:M.tests.map(t=>t.id),res:{}};put('tests',id,s);openTest(id)}
function openTest(id){UI.tst={id,test:null};UI.sheetLive=renderTest;renderTest()}
function renderTest(){const s=ctx().tests[UI.tst.id];if(!s){closeSheet();return}const M=META(),k=L.seasonOf(s.data);const tests=(s.testes||[]).map(id=>M.tests.find(t=>t.id===id)).filter(Boolean);
  if(!UI.tst.test||!tests.find(t=>t.id===UI.tst.test))UI.tst.test=tests[0]?.id;const T=tests.find(t=>t.id===UI.tst.test);
  let h=shH('Testes físicos')+`<div class="grid2"><div><label>Data</label><input type="date" value="${s.data}" data-c="tsF" data-k="data"></div><div><label>&nbsp;</label><button class="btn ghost" style="width:100%" data-a="printTest">🖨 Imprimir A4</button></div></div>
   <label>Turmas</label><div class="chips">${CD().turmas.map(t=>`<button class="chip ${(s.turmas||[]).includes(t.id)?'on':''}" data-a="tsTurma" data-t="${t.id}">${esc(t.nome)}</button>`).join('')}</div>
   <label>Testes</label><div class="chips">${M.tests.map(t=>`<button class="chip ${(s.testes||[]).includes(t.id)?'on':''}" data-a="tsTeste" data-id="${t.id}">${esc(t.nome)}</button>`).join('')}</div>`;
  if(!T){openSheet(h+empty('Escolhe pelo menos um teste.'));return}
  h+=`<div class="seg" style="margin-top:14px">${tests.map(t=>`<button class="${t.id===T.id?'on':''}" data-a="tsTab" data-id="${t.id}">${esc(t.nome.split(' ').slice(0,2).join(' '))}</button>`).join('')}</div>
   <p class="muted sm">${esc(T.prot||'')} · ${esc(T.un)} · ${T.melhor==='min'?'menor é melhor':'maior é melhor'} · ${T.tent||1} tentativa(s), conta a melhor</p>`;
  const crono=T.crono||T.un==='s';const sw=UI.sw;
  if(crono)h+=`<div class="sw"><div class="seg" style="margin:0 0 8px">${[['ind','Individual'],['grp','Grupo']].map(([v,l])=>`<button class="${sw.mode===v?'on':''}" data-a="swMode" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="swd" id="swd">${fmtSw(sw.run?(performance.now()-sw.t0)/1000:0)}</div><div class="muted sm" style="text-align:center">${sw.mode==='ind'?(sw.run?`A cronometrar <b>${esc(N(sw.ath))}</b> — toca ⏹ para parar`:'Toca ⏱ ao lado do atleta para começar'):(sw.run?'A correr — toca no nome de quem termina':'')}</div>
    ${sw.mode==='grp'?`<div class="row gap" style="margin-top:8px"><button class="btn grow" data-a="swGo">${sw.run?'Parar':'Iniciar'}</button></div>`:''}</div>`;
  for(const tid of (s.turmas||[])){const as=athsIn(k,tid);if(!as.length)continue;
    h+=`<div class="list"><div class="gh">${esc(turma(tid).nome)}</div>${as.map(a=>{const arr=s.res?.[a.id]?.[T.id]||[];const best=L.bestOf(T,arr);const prev=L.prevResult(ctx().tests,T,a.id,s.data,s.id);const imp=L.improved(T,best,prev);
      return `<div class="li tl">${crono&&sw.mode==='grp'?`<button class="nm grow btn ghost sm" style="text-align:left" data-a="swLap" data-id="${a.id}">${esc(nameOf(a))}</button>`:`<div class="grow"><div class="nm">${esc(nameOf(a))}</div>`}
        ${crono&&sw.mode==='grp'?'<div>':''}<div class="muted sm">${prev!=null?'ant. '+L.fmtNum(prev,T.dec):''}${best!=null&&prev!=null?` <b class="${imp>0?'up':imp<0?'down':''}">${imp>0?'▲':imp<0?'▼':'='} ${L.fmtNum(Math.abs(best-prev),T.dec)}</b>`:''}</div></div>
        <div class="tents">${Array.from({length:T.tent||1},(_,i)=>`<input type="number" step="any" inputmode="decimal" value="${arr[i]??''}" data-c="tsRes" data-id="${a.id}" data-n="${i}" class="tin ${best!=null&&+arr[i]===best?'best':''}">`).join('')}
        ${crono&&sw.mode==='ind'?`<button class="btn sm ${sw.run&&sw.ath===a.id?'danger':''}" data-a="swInd" data-id="${a.id}">${sw.run&&sw.ath===a.id?'⏹':'⏱'}</button>`:''}</div></div>`}).join('')}</div>`}
  h+=`<button class="btn danger block" data-a="delTest">Apagar sessão</button>`;openSheet(h);if(sw.run)tickSw()}
const fmtSw=s=>s.toFixed(2).replace('.',',')+' s';
function tickSw(){cancelAnimationFrame(tickSw.r);const f=()=>{const el=$('#swd');if(!el||!UI.sw.run)return;el.textContent=fmtSw((performance.now()-UI.sw.t0)/1000);tickSw.r=requestAnimationFrame(f)};tickSw.r=requestAnimationFrame(f)}
function recordTime(athId,sec){const s=copy(ctx().tests[UI.tst.id]);const T=META().tests.find(t=>t.id===UI.tst.test);s.res=s.res||{};const r=(s.res[athId]=s.res[athId]||{});const arr=(r[T.id]=r[T.id]||[]);
  let i=arr.findIndex(x=>x===''||x==null);if(i<0)i=arr.length<(T.tent||1)?arr.length:(T.tent||1)-1;arr[i]=Math.round(sec*100)/100;put('tests',s.id,s);toast(`${N(athId)}: ${fmtSw(sec)}`)}
function printTest(){const s=ctx().tests[UI.tst.id],M=META(),cd=CD(),k=L.seasonOf(s.data);const tests=(s.testes||[]).map(id=>M.tests.find(t=>t.id===id)).filter(Boolean);
  let h=`<div class="ph"><div><h1>${esc(cd.nome)} · Testes físicos</h1><div>${DOWL[L.wdOf(s.data)]}, ${fmtD(s.data)}</div></div><div class="leg">resultado · (anterior) · progressão<br><span class="up">▲ melhorou</span> <span class="down">▼ piorou</span></div></div>`;
  for(const tid of (s.turmas||[])){const as=athsIn(k,tid).filter(a=>s.res?.[a.id]);if(!as.length)continue;
    h+=`<h2>${esc(turma(tid).nome)}</h2><table><thead><tr><th>Atleta</th>${tests.map(t=>`<th>${esc(t.nome)}<br><small>${esc(t.un)} · ${t.melhor==='min'?'menor é melhor':'maior é melhor'}</small></th>`).join('')}</tr></thead><tbody>
    ${as.map(a=>`<tr><td class="pn">${esc(nameOf(a))}</td>${tests.map(t=>{const b=L.bestOf(t,s.res[a.id]?.[t.id]);const p=L.prevResult(ctx().tests,t,a.id,s.data,s.id);const im=L.improved(t,b,p);
      return `<td><b>${L.fmtNum(b,t.dec)}</b>${p!=null?` <span class="pv">(${L.fmtNum(p,t.dec)})</span>`:''}${b!=null&&p!=null?` <span class="${im>0?'up':im<0?'down':''}">${im>0?'▲':im<0?'▼':'='}${L.fmtNum(Math.abs(b-p),t.dec)}</span>`:''}</td>`}).join('')}</tr>`).join('')}</tbody></table>`}
  $('#print').innerHTML=h;setTimeout(()=>window.print(),50)}

/* ---------- PLANO MENSAL ---------- */
function planDraft(){const m=UI.aul.m||today().slice(0,7);const f=META().frases?.[m]||{};UI.draft={kind:'plan',m,texto:f.texto||'',autor:f.autor||''};UI.sheetLive=null;renderPlan()}
function renderPlan(){const d=UI.draft;const rows=monthRows(d.m);
  openSheet(shH('Plano do mês')+`<div class="card"><div class="sm"><b>${esc(planTitle())}</b> · ${mLabel(d.m)}</div><p class="muted sm">${rows.filter(r=>r.tipo!=='ev').length} aulas e reposições · ${rows.filter(r=>r.tipo==='ev').length} evento(s). Inclui reposições e eventos marcados para o mês; aulas canceladas, feriados e pausas ficam de fora.</p>
  <label>Frase do mês</label><textarea data-i="pl" data-k="texto" placeholder="A vida contrai-se e expande-se…">${esc(d.texto)}</textarea><label>Autor</label><input value="${esc(d.autor)}" data-i="pl" data-k="autor" placeholder="Anaïs Nin">
  <p class="muted sm">A frase fica guardada para o mês e aparece também no plano do outro clube.</p></div>
  <button class="btn block" data-a="doPlan">🖨 Imprimir / guardar PDF</button><p class="muted sm">No telemóvel, escolhe “Guardar como PDF” na janela de impressão para partilhar.</p>`)}
function planTitle(){const cd=CD();const t=cd.cfg?.titulo;if(t)return t;const n=cd.nome.toUpperCase();return /WADO/.test(n)?n:n+' WADO KARATÉ'}
function monthRows(m){const cd=CD();const last=L.addDays(L.addMonths(m,1)+'-01',-1);const ss=L.sessionsBetween(cd,CL().sessions,m+'-01',last).filter(s=>s.estado!=='cancelada'&&s.estado!=='feriado');
  const loc=cd.cfg?.local||cd.nome;const byDate={};for(const s of ss){const t=s.tipo==='reposicao'?'rep':s.tipo==='extra'?'extra':'aula';const x=byDate[s.data]||(byDate[s.data]={data:s.data,tipo:t});if(t==='aula')x.tipo='aula'}
  const rows=Object.values(byDate).map(x=>({data:x.data,tipo:x.tipo,nome:x.tipo==='rep'?'Aula Reposição':x.tipo==='extra'?'Aula Extra':'Aula',local:loc}));
  for(const e of Object.values(ctx().events))if(e.data>=m+'-01'&&e.data<=last)rows.push({data:e.data,tipo:'ev',nome:e.nome,local:e.local||'',ev:e});
  return rows.sort((a,b)=>a.data!==b.data?(a.data<b.data?-1:1):(a.tipo==='ev'?1:-1)).map(r=>({...r,sem:L.weekNo(cd,r.data)}))}
const hh=t=>t?t.replace(':','h'):'';
function printMonth(m,frase){const cd=CD(),k=L.seasonOf(m+'-15');const rows=monthRows(m);const last=L.addDays(L.addMonths(m,1)+'-01',-1);
  const weeks=[];for(const r of rows){const w=weeks[weeks.length-1];if(w&&w.sem===r.sem)w.rows.push(r);else weeks.push({sem:r.sem,rows:[r]})}
  const mes=L.MESES[+m.slice(5,7)-1];let tb='';let first=true;
  for(const w of weeks)w.rows.forEach((r,i)=>{const cls=r.tipo==='rep'?'rp':r.tipo==='ev'?'ev':'';
    tb+=`<tr>${first?`<td rowspan="${rows.length}" class="mc">${mes}</td>`:''}${i===0?`<td rowspan="${w.rows.length}" class="mc">${w.sem}</td>`:''}<td class="${cls}">${esc(r.nome)}</td><td class="${cls}">${fmtD(r.data).slice(0,5)}</td><td class="${cls}">${esc(r.local)}</td></tr>`;first=false});
  let h=`<div class="mp"><h1>${esc(planTitle())} ${k} – ${+k+1}</h1><h3>Calendário ${mes}</h3>
   <table class="cal"><thead><tr><th>Mês</th><th>Semana</th><th>Evento</th><th>Data</th><th>Local</th></tr></thead><tbody>${tb||'<tr><td colspan="5">Sem atividades</td></tr>'}</tbody></table>`;
  const reps=Object.values(CL().sessions).filter(s=>s.tipo==='reposicao'&&s.estado!=='cancelada'&&s.data>=m+'-01'&&s.data<=last);
  if(reps.length){const slots={};reps.forEach(s=>{const key=`${s.ini}|${s.fim}`;(slots[key]=slots[key]||new Set()).add(turma(s.turma).nome)});const keys=Object.keys(slots).sort();
    const single=keys.length===1;h+=`<table class="box"><tr><th colspan="2" class="rp">Horário Aula de Reposição</th></tr>${keys.map(key=>{const[a,b]=key.split('|');const lab=[...slots[key]].join(' e ');return single&&slots[key].size>1?`<tr><td colspan="2">${hh(a)} – ${hh(b)}</td></tr>`:`<tr><td>Aula ${esc(lab)}:</td><td>${hh(a)} – ${hh(b)}</td></tr>`}).join('')}</table>`}
  for(const e of Object.values(ctx().events).filter(e=>e.data>=m+'-01'&&e.data<=last&&(e.horario||'').trim()).sort((a,b)=>a.data<b.data?-1:1)){
    h+=`<table class="box"><tr><th colspan="2" class="ev">Horário ${esc(e.nome)}</th></tr>${e.horario.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const i=Math.max(l.lastIndexOf(';'),l.lastIndexOf('|'));return i>0?`<tr><td>${esc(l.slice(0,i).trim())}</td><td>${esc(l.slice(i+1).trim())}</td></tr>`:`<tr><td colspan="2">${esc(l)}</td></tr>`}).join('')}</table>`}
  if(frase?.texto)h+=`<div class="fr"><div>Frase do Mês:</div><blockquote>“${esc(frase.texto.replace(/^[“"]|[”"]$/g,''))}”</blockquote>${frase.autor?`<div class="au">${esc(frase.autor)}</div>`:''}</div>`;
  $('#print').innerHTML=h+'</div>';setTimeout(()=>window.print(),80)}

/* ---------- ANIVERSÁRIOS ---------- */
V.aniv=()=>{const cd=CD(),k=K();const as=athsIn(k,'',curMonth(k)).filter(a=>a.nasc);const exp=new Set(cd.icsExp||[]);const nw=as.filter(a=>!exp.has(a.id));const up=L.upcomingBirthdays(as,today(),60);
  return back('Aniversários')+`<div class="card"><p class="sm">Exporta os aniversários para um <b>calendário separado</b> no Google Calendar (ex.: “Aniversários Karaté”). Cada atleta fica com um evento anual e alertas na véspera e no próprio dia.</p>
  <button class="btn block" data-a="ics" data-v="new" ${nw.length?'':'disabled'}>Exportar só os novos (${nw.length})</button><button class="btn ghost block" data-a="ics" data-v="all">Exportar todos (${as.length})</button>
  <details><summary>Como importar no Google Calendar</summary><ol class="sm"><li>No computador, abre calendar.google.com → ⚙️ Definições.</li><li>“Adicionar calendário” → “Criar novo calendário” → nome “Aniversários Karaté”.</li><li>“Importar e exportar” → escolhe o ficheiro .ics e, em “Adicionar ao calendário”, escolhe “Aniversários Karaté”.</li><li>Nas definições desse calendário, em “Notificações de eventos de dia inteiro”, põe “1 dia antes às 9:00” e “no dia às 9:00” (o Google ignora os alertas do ficheiro).</li><li>Para recomeçar do zero, apaga o calendário e importa todos de novo.</li></ol></details></div>
  <h3 style="margin:12px 0 8px">Próximos 60 dias</h3>${up.length?`<div class="list">${up.map(x=>`<div class="li"><div class="grow"><div class="nm">${esc(nameOf(x.a))}</div><div class="muted sm">${x.i===0?'Hoje':x.i===1?'Amanhã':DOW[L.wdOf(x.d)]+' '+fmtD(x.d).slice(0,5)} · faz ${x.age}</div></div><button class="btn sm ghost" data-a="parab" data-id="${x.a.id}">Parabéns</button></div>`).join('')}</div>`:empty('Sem aniversários nos próximos 60 dias.')}`};

/* ---------- DEFINIÇÕES DO CLUBE ---------- */
V.config=()=>{if(UI.draft?.kind!=='club'||UI.draft.cid!==UI.club)UI.draft={kind:'club',cid:UI.club,c:copy(CD())};const c=UI.draft.c,k=K(),ep=c.epocas[k];const cfg=c.cfg=c.cfg||{};const ges=c.modelo==='gestao';
  const rows=(key,list,fields,addLabel)=>`${(list||[]).map((r,i)=>`<div class="hrow">${fields.map(([f,l,t,w])=>`<label class="mini" style="${w?'flex:0 0 '+w:''}">${l}<input ${t?`type="${t}"`:''} step="any" value="${esc(r[f]??'')}" data-c="cfgRow" data-key="${key}" data-i="${i}" data-f="${f}"></label>`).join('')}<button class="x" data-a="cfgRm" data-key="${key}" data-i="${i}">×</button></div>`).join('')}<button class="btn sm ghost" data-a="cfgAdd" data-key="${key}">+ ${addLabel}</button>`;
  let h=back('Definições do clube')+`<div class="card"><label>Nome</label><input value="${esc(c.nome)}" data-c="cfgTop" data-k="nome">
   <div class="grid2"><div><label>Título no plano mensal</label><input value="${esc(cfg.titulo||'')}" placeholder="${esc(/WADO/i.test(c.nome)?c.nome.toUpperCase():c.nome.toUpperCase()+' WADO KARATÉ')}" data-c="cfgCfg" data-k="titulo"></div><div><label>Local das aulas</label><input value="${esc(cfg.local||'')}" placeholder="${esc(c.nome)}" data-c="cfgCfg" data-k="local"></div></div>
   <label>Modelo de contas</label><div class="seg">${[['gestao','Gestão completa'],['professor','Só professor']].map(([v,l])=>`<button class="${c.modelo===v?'on':''}" data-a="cfgModelo" data-v="${v}">${l}</button>`).join('')}</div>
   <label>Turmas</label>${c.turmas.map((t,i)=>`<div class="hrow"><label class="mini">Nome<input value="${esc(t.nome)}" data-c="cfgTurma" data-i="${i}" data-f="nome"></label><label class="mini" style="flex:0 0 80px">Prefixo<input value="${esc(t.pre)}" data-c="cfgTurma" data-i="${i}" data-f="pre"></label></div>`).join('')}</div>`;
  h+=`<div class="card"><h3>Horários</h3><p class="muted sm">Quando o horário muda, cria um novo com a data a partir da qual vale. As aulas anteriores mantêm-se.</p>${c.horarios.map((ho,hi)=>`<div class="blk"><div class="row gap"><label class="mini grow">A partir de<input type="date" value="${ho.desde}" data-c="hoDesde" data-hi="${hi}"></label>${c.horarios.length>1?`<button class="x" data-a="hoRm" data-hi="${hi}">×</button>`:''}</div>
    ${ho.slots.map((s,si)=>`<div class="slot"><select data-c="hoS" data-hi="${hi}" data-si="${si}" data-f="t">${c.turmas.map(t=>`<option value="${t.id}" ${s.t===t.id?'selected':''}>${esc(t.nome)}</option>`).join('')}</select><select data-c="hoS" data-hi="${hi}" data-si="${si}" data-f="wd">${[1,2,3,4,5,6,0].map(w=>`<option value="${w}" ${+s.wd===w?'selected':''}>${DOW[w]}</option>`).join('')}</select><input type="time" value="${s.ini}" data-c="hoS" data-hi="${hi}" data-si="${si}" data-f="ini"><input type="time" value="${s.fim}" data-c="hoS" data-hi="${hi}" data-si="${si}" data-f="fim"><button class="x" data-a="hoSRm" data-hi="${hi}" data-si="${si}">×</button></div>`).join('')}
    <button class="btn sm ghost" data-a="hoSAdd" data-hi="${hi}">+ aula</button></div>`).join('')}<button class="btn sm" data-a="hoAdd">+ Novo horário</button></div>`;
  h+=`<div class="card"><h3>Feriados e pausas</h3><p class="muted sm">Os feriados nacionais (incluindo Sexta-feira Santa e Corpo de Deus) são automáticos: essas aulas aparecem como feriado, não ficam por repor e saem do plano mensal. Se mesmo assim deres aula, basta registá-la.</p>
   <label>Feriado municipal (MM-DD, ex.: 06-24 para Gaia)</label><input value="${esc(cfg.municipal||'')}" placeholder="06-24" data-c="cfgCfg" data-k="municipal">
   <label>Pausas (Natal, Páscoa, Carnaval…)</label>${rows('pausas',cfg.pausas,[['desde','De','date'],['ate','Até','date'],['motivo','Motivo']],'pausa')}</div>`;
  h+=`<div class="card"><div class="ch"><h3>Época ${seasonLabel(k)}</h3><button class="btn sm ghost" data-a="newSeason">+ Nova época</button></div><div class="grid2"><div><label>Início</label><input type="date" value="${ep.inicio}" data-c="epF" data-k="inicio"></div><div><label>Fim</label><input type="date" value="${ep.fim||''}" data-c="epF" data-k="fim"></div></div>
   <label>${ges?'Meses de cobrança':'Meses com remuneração'}</label><div class="chips">${L.seasonMonthsAll(k).map(m=>`<button class="chip ${(ep.meses||[]).includes(m)?'on':''}" data-a="epMes" data-m="${m}">${mShort(m)}</button>`).join('')}</div>
   ${ges?`<label>Saldo da poupança no início da época (€)</label><input type="number" step="0.01" value="${ep.poupInicial||0}" data-c="epF" data-k="poupInicial">`:''}</div>`;
  if(ges)h+=`<div class="card"><h3>Mensalidades</h3><label>Valores base (a partir do mês)</label>${rows('valores',cfg.valores,[['desde','Desde','month'],['1','1×/sem','number','70px'],['2','2×/sem','number','70px']],'valores')}
   <h3 style="margin-top:14px">Descontos</h3><p class="muted sm">Tipos: irmao (irmão no karaté), irmaoOutra (irmão noutra modalidade), amigo (traz um amigo, com duração em meses). Cada linha vale a partir do mês indicado; para terminar uma regra, cria uma linha com valor 0.</p>
   ${rows('descontos',cfg.descontos,[['tipo','Tipo','','95px'],['desde','Desde','month'],['v1','1×','number','55px'],['v2','2×','number','55px'],['meses','Meses','number','55px']],'desconto')}
   <label>Desconto máximo por atleta (€/mês)</label><input type="number" value="${cfg.descMax??''}" data-c="cfgCfg" data-k="descMax"></div>
   <div class="card"><h3>Divisão das receitas</h3><div class="grid2"><div><label>Entidade a pagar</label><input value="${esc(cfg.entNome||'')}" data-c="cfgCfg" data-k="entNome"></div><div><label>Nome da poupança</label><input value="${esc(cfg.poupNome||'')}" data-c="cfgCfg" data-k="poupNome"></div></div>
   <label>% para a entidade (a partir do mês)</label>${rows('pctEspaco',cfg.pctEspaco,[['desde','Desde','month'],['v','%','number','80px']],'percentagem')}
   <label>Poupança mensal (a partir do mês)</label>${rows('poupMensal',cfg.poupMensal,[['desde','Desde','month'],['v','€/mês','number','80px']],'valor')}
   <label>% da poupança suportada pela entidade</label><input type="number" value="${cfg.poupShare??50}" data-c="cfgCfg" data-k="poupShare"></div>`;
  else h+=`<div class="card"><h3>Remuneração</h3><div class="grid2"><div><label>Valor por aluno/mês (€)</label><input type="number" step="0.5" value="${cfg.valorAluno??''}" data-c="cfgCfg" data-k="valorAluno"></div><div><label>Valor por aula (€)</label><input type="number" step="0.5" value="${cfg.valorAula??''}" data-c="cfgCfg" data-k="valorAula"></div></div></div>`;
  h+=`<div class="card"><label>Peso da falta justificada na assiduidade</label><input type="number" step="0.05" value="${cfg.pesoJ??0.2}" data-c="cfgCfg" data-k="pesoJ"></div>
   <button class="btn block" data-a="saveCfg">Guardar definições</button><button class="btn danger block" data-a="delClub">Apagar este clube</button>`;return h};

/* ---------- DEFINIÇÕES GERAIS ---------- */
V.geral=()=>{if(UI.draft?.kind!=='meta')UI.draft={kind:'meta',m:copy(META())};const m=UI.draft.m;const Y=Object.keys(m.quotas||{}).sort();
  const lst=(key,fields,label)=>`${(m[key]||[]).map((r,i)=>`<div class="hrow">${fields.map(([f,l,t,w])=>t==='sel'?`<label class="mini" style="flex:0 0 ${w}">${l}<select data-c="mRow" data-key="${key}" data-i="${i}" data-f="${f}"><option value="max" ${r[f]==='max'?'selected':''}>maior</option><option value="min" ${r[f]==='min'?'selected':''}>menor</option></select></label>`:`<label class="mini" style="${w?'flex:0 0 '+w:''}">${l}<input ${t?`type="${t}"`:''} step="any" value="${esc(r[f]??'')}" data-c="mRow" data-key="${key}" data-i="${i}" data-f="${f}"></label>`).join('')}<button class="x" data-a="mRm" data-key="${key}" data-i="${i}">×</button></div>`).join('')}<button class="btn sm ghost" data-a="mAdd" data-key="${key}">+ ${label}</button>`;
  let h=back('Definições gerais')+`<div class="card"><h3>Quotas por ano civil</h3><p class="muted sm">Infantil = até aos 9 anos. Reduzido = quem entra entre setembro e dezembro (só federação e associação).</p>
   ${Y.map(y=>`<div class="blk"><b>${y}</b>${L.QITEMS.map(([it,l])=>`<div class="hrow"><span style="flex:0 0 78px" class="sm">${l}</span>${(it==='seg'?[['inf','Infantil'],['norm','Normal']]:[['inf','Infantil'],['norm','Normal'],['redInf','Red. inf.'],['redNorm','Red. norm.']]).map(([f,fl])=>`<label class="mini">${fl}<input type="number" step="0.01" value="${m.quotas[y][it]?.[f]??0}" data-c="mQ" data-y="${y}" data-it="${it}" data-f="${f}"></label>`).join('')}</div>`).join('')}</div>`).join('')}
   <button class="btn sm ghost" data-a="mQAdd">+ Ano ${Y.length?+Y[Y.length-1]+1:today().slice(0,4)}</button></div>
   <div class="card"><h3>Tipos de prémio</h3>${lst('awardTypes',[['nome','Nome'],['pts','Pontos','number','70px']],'tipo')}<h3 style="margin-top:12px">Pontos de assiduidade (por trimestre)</h3>${lst('assidTiers',[['min','A partir de %','number'],['pts','Pontos','number']],'patamar')}</div>
   <div class="card"><h3>Bateria de testes</h3>${lst('tests',[['nome','Nome'],['un','Unid.','','55px'],['melhor','Melhor','sel','80px'],['tent','Tent.','number','50px'],['dec','Dec.','number','50px']],'teste')}</div>
   <div class="card"><h3>Graduações</h3><textarea data-c="mGraus">${esc((m.graus||[]).join('\n'))}</textarea></div>
   <div class="card"><h3>Mensagens</h3><p class="muted sm">Variáveis: {nome} {clube} {detalhe} {mens}</p>${[['pag','Confirmação de mensalidade'],['lemb','Lembrete de mensalidade'],['quota','Confirmação de quotas e taxas'],['parab','Parabéns']].map(([k,l])=>`<label>${l}</label><textarea data-c="mMsg" data-k="${k}">${esc(m.msgs?.[k]||'')}</textarea>`).join('')}</div>
   <button class="btn block" data-a="saveMeta">Guardar definições</button>`;return h};

/* ---------- DADOS ---------- */
V.dados=()=>back('Dados e backup')+`<div class="card"><p class="sm">Os dados estão guardados na tua conta Firebase e sincronizados entre dispositivos. Um backup extra de vez em quando não faz mal.</p>
  <button class="btn block" data-a="exportAll">Exportar backup completo (.json)</button><button class="btn ghost block" data-a="importJSON">Importar backup (.json)</button>
  <div class="grid2"><button class="btn ghost block" data-a="csvAtt">Presenças CSV</button><button class="btn ghost block" data-a="csvPay">Mensalidades CSV</button></div>
  <p class="muted sm">A importação aceita backups desta app e também os da versão offline anterior (ficheiro cwk/karate-backup), que entram no clube atual.</p></div>`;

/* ---------- SHEET ---------- */
function openSheet(h){$('#sheetBody').innerHTML=h;$('#sheet').classList.remove('hidden');document.body.classList.add('noscroll')}
function closeSheet(){$('#sheet').classList.add('hidden');document.body.classList.remove('noscroll');UI.sheetLive=null;if(UI.sw.run){UI.sw.run=false}if(UI.draft&&!['club','meta'].includes(UI.draft.kind))UI.draft=null;render()}
const shH=t=>`<div class="sh-h"><h2 style="margin:0">${t}</h2><button class="x" data-a="close" aria-label="Fechar">×</button></div>`;

/* ---------- AÇÕES ---------- */
function payItems(id,m){const cd=CD(),k=K(),cx=ctx();const p=cx.payments[m]?.[id];const ms=(cd.epocas[k].meses||[]).filter(mm=>{const q=cx.payments[mm]?.[id];return q?.s==='P'&&(mm===m||(p?.d&&q.d===p.d))});
  return ms.map(mm=>({m:mm,f:L.freqAt(L.enr(cx.athletes[id],k),mm),v:+cx.payments[mm][id].v}))}
function msgVars(id,items,detailFn){return{nome:N(id),clube:CD().nome,detalhe:detailFn(items),mens:items.length>1?'das mensalidades':'da mensalidade'}}
function quotaGen(Y){const cx=ctx(),k=(CD().epocas[String(+Y-1)]?String(+Y-1):K());const as=Object.values(cx.athletes).filter(a=>L.enr(a,k)&&!L.enr(a,k).ate);let n=0;
  for(const a of as)for(const[it]of L.QITEMS){const id=`q_${Y}_${it}_${a.id}`;if(!cx.fees[id]){put('fees',id,{id,ano:Y,item:it,ath:a.id,red:false,estado:'falta'});n++}}toast(n?`${n} quotas de ${Y} criadas`:'Já estavam todas criadas')}
const A={
  login:async()=>{try{await api().login()}catch(e){alert('Não foi possível entrar: '+(e.code||e.message))}},
  logout:(d,el,e)=>{e.preventDefault();if(confirm('Sair da conta?'))api().logout()},
  clrErr:()=>{DB.error='';render()},
  tab:d=>{UI.tab=d.t;UI.draft=null;closeSheet();window.scrollTo(0,0)},
  close:()=>closeSheet(),
  sheetBg:(d,el,e)=>{if(e.target.id==='sheet')closeSheet()},
  seedAll:async(d,el)=>{el.disabled=true;el.textContent='A criar…';const S=seedClubs();const ops=[{meta:true,data:seedMeta()}];
    for(const cid in S){const c=S[cid];ops.push({cid,data:c.doc});for(const col of ['athletes','sessions','payments'])for(const id in (c[col]||{}))ops.push({cid,col,id,data:c[col][id]})}
    try{await api().bulk(ops);UI.club='cart';pref('club','cart');UI.tab='dados';toast('Clubes criados — agora importa o ficheiro cart-2025-26.json')}catch(e){alert('Erro: '+e.message);el.disabled=false}},
  newClub:()=>{const n=prompt('Nome do clube');if(!n||!n.trim())return;const id='c'+uid();const k=L.seasonOf(today());const pre=n.trim().slice(0,1).toUpperCase();
    if(!DB.meta)api().putMeta(seedMeta());
    api().put(id,null,null,{id,nome:n.trim(),modelo:'gestao',turmas:[{id:'C',nome:'Crianças',pre:pre+'C'},{id:'A',nome:'Adultos',pre:pre+'A'}],horarios:[{desde:`${k}-09-01`,slots:[]}],
      epocas:{[k]:{inicio:`${k}-09-01`,fim:`${+k+1}-07-31`,meses:L.seasonMonthsAll(k).slice(0,11),poupInicial:0}},cfg:{valores:[{desde:`${k}-09`,1:20,2:28}],pctEspaco:[{desde:`${k}-09`,v:0}],poupMensal:[{desde:`${k}-09`,v:0}],poupShare:50,entNome:'Espaço',poupNome:'Poupança',descontos:[],descMax:10,pesoJ:0.2,valorAluno:0,valorAula:0,modeloPag:'aluno'},icsExp:[]});
    UI.club=id;pref('club',id);UI.tab='config';UI.draft=null;toast('Clube criado — define horários e contas')},
  goContas:d=>{UI.tab='contas';UI.con.v=d.v;render()},
  goInscrever:()=>{UI.tab='atletas';UI.ath.f='out';render()},
  openSess:d=>openSess(d.id),
  sessEst:d=>{const s=getSess();if(s.estado===d.v)s.estado='prevista';else{s.estado=d.v;if(d.v==='cancelada')s.pres={};if(d.v==='dada'&&!s.plano)s.plano=L.suggestCode(CD(),CL().sessions,s)}
    if(s.estado==='prevista'&&!Object.keys(s.pres||{}).length&&!s.plano&&!s.nota&&s.tipo==='normal'){del('sessions',s.id);UI.sess.v={...s,virtual:true};renderSess();return}saveSess(s)},
  sessAw:d=>{UI.sess.aw=UI.sess.aw===d.id?null:d.id;renderSess()},
  sessAwAdd:d=>{const s=getSess();const t=(META().awardTypes||[]).find(x=>x.id===d.t);if(!t)return;const id='w'+uid();put('awards',id,{id,ath:d.id,tipo:t.id,nome:t.nome,pts:+t.pts||0,data:s.data,sess:s.id,nota:''});toast(`${N(d.id)}: ${t.nome} +${t.pts}`)},
  sessAwDel:d=>{del('awards',d.id)},
  sessSug:()=>{const s=getSess();s.plano=L.suggestCode(CD(),CL().sessions,s);if(s.estado!=='dada')s.estado='dada';saveSess(s)},
  mark:d=>{const s=getSess();s.pres=s.pres||{};if(s.pres[d.id]===d.s)delete s.pres[d.id];else s.pres[d.id]=d.s;if(Object.keys(s.pres).length&&s.estado!=='dada'){s.estado='dada'}if(s.estado==='dada'&&!s.plano)s.plano=L.suggestCode(CD(),CL().sessions,s);saveSess(s)},
  allP:()=>{const s=getSess(),k=L.seasonOf(s.data),wd=L.wdOf(s.data);s.pres=s.pres||{};athsIn(k,s.turma,s.data.slice(0,7)).filter(a=>(L.enr(a,k).dias||[]).includes(wd)).forEach(a=>{if(!s.pres[a.id])s.pres[a.id]='P'});s.estado='dada';if(!s.plano)s.plano=L.suggestCode(CD(),CL().sessions,s);saveSess(s)},
  sessDel:()=>{if(!confirm('Apagar o registo desta aula (presenças, plano, estado)?'))return;const s=getSess();del('sessions',s.id);closeSheet()},
  newRepo:d=>repoDraft(d.from,false),newExtra:()=>repoDraft(null,true),
  repoT:d=>{UI.draft.turmas[d.t]=!UI.draft.turmas[d.t];renderRepo()},
  saveRepo:()=>{const d=UI.draft;if(!d.data){toast('Falta a data');return}const sel=Object.keys(d.turmas).filter(t=>d.turmas[t]);if(!sel.length){toast('Escolhe uma turma');return}
    let first=null;for(const t of sel){let id=`${d.data}_${t}_R`,i=2;while(CL().sessions[id])id=`${d.data}_${t}_R${i++}`;const rep=d.repoe[t];
      put('sessions',id,{id,data:d.data,turma:t,ini:d.ini,fim:d.fim,tipo:rep?'reposicao':'extra',estado:'prevista',repoe:rep?[rep]:[],pres:{},plano:'',nota:''});first=first||id}
    toast(sel.length>1?`${sel.length} aulas criadas`:'Aula criada');UI.draft=null;openSess(first)},
  aulT:d=>{UI.aul.t=d.t;render()},
  athF:d=>{UI.ath.f=d.f;render()},
  newAth:()=>athDraft(null),
  editAth:(d,el,e)=>{if(e.target.closest('[data-a="quickEnr"]'))return;athDraft(d.id)},
  quickEnr:(d,el,e)=>{e.stopPropagation();const k=K();const a=copy(ctx().athletes[d.id]);const prev=Object.keys(a.insc||{}).filter(s=>s<k).sort().map(s=>a.insc[s]).pop();a.insc=a.insc||{};a.insc[k]=newEnr(prev,k);put('athletes',a.id,a);toast(nameOf(a)+' inscrito em '+seasonLabel(k))},
  afCanal:d=>{UI.draft.a.canal=d.v;renderAth()},afTog:d=>{UI.draft.a[d.k]=!UI.draft.a[d.k];renderAth()},
  contact:()=>{const a=UI.draft.a;sendMsg(a,'')},
  togEnr:()=>{const k=K(),a=UI.draft.a;if(a.insc[k]){if(!confirm('Tirar a inscrição desta época?'))return;delete a.insc[k]}else{const prev=Object.keys(a.insc).filter(s=>s<k).sort().map(s=>a.insc[s]).pop();a.insc[k]=newEnr(prev,k)}renderAth()},
  eTurma:d=>{UI.draft.a.insc[K()].turma=d.t;renderAth()},
  eDia:d=>{const e=UI.draft.a.insc[K()],w=+d.w;e.dias=(e.dias||[]).includes(w)?e.dias.filter(x=>x!==w):[...(e.dias||[]),w].sort();if(UI.draft.isNew&&e.freq?.length===1)e.freq[0].n=Math.max(1,e.dias.length);renderAth()},
  eIsento:()=>{const e=UI.draft.a.insc[K()];e.isento=!e.isento;renderAth()},
  addFreq:()=>{const e=UI.draft.a.insc[K()];const n=+$('#nfN').value,m=$('#nfM').value;if(!m)return;e.freq=(e.freq||[]).filter(f=>f.desde!==m);e.freq.push({desde:m,n});renderAth()},
  rmFreq:d=>{const e=UI.draft.a.insc[K()];e.freq=e.freq.filter(f=>f.desde!==d.d);renderAth()},
  addMan:()=>{const e=UI.draft.a.insc[K()];const m=$('#vmM').value,v=$('#vmV').value,n=$('#vmN').value;if(!m)return;e.manual=(e.manual||[]).filter(x=>x.desde!==m);e.manual.push({desde:m,v:v===''?'':+v,nota:n});renderAth()},
  rmMan:d=>{const e=UI.draft.a.insc[K()];e.manual=e.manual.filter(x=>x.desde!==d.d);renderAth()},
  saveAth:()=>{const{a,isNew}=UI.draft;if(!a.nome.trim()){toast('Falta o nome');return}a.nome=a.nome.trim().toUpperCase();
    if(isNew){a.id=a.fnkp?'a'+a.fnkp.trim():'n'+uid();if(ctx().athletes[a.id]){alert('Já existe um atleta com este nº FNKP.');return}}
    put('athletes',a.id,a);const k=K();const t=today();
    if(isNew&&a.insc[k]&&+t.slice(5,7)>=9){const Y=t.slice(0,4);for(const[it]of L.QITEMS){const id=`q_${Y}_${it}_${a.id}`;put('fees',id,{id,ano:Y,item:it,ath:a.id,red:it!=='seg',estado:'falta'})}toast(`Guardado · quotas ${Y} (reduzidas) criadas`)}else toast('Guardado');
    UI.draft=null;closeSheet()},
  delAth:()=>{const id=UI.draft.a.id;if(!confirm('Apagar '+N(id)+' e todo o histórico? Para quem só não treina este ano, basta tirar a inscrição.'))return;
    del('athletes',id);const cx=ctx();for(const s of Object.values(cx.sessions))if(s.pres?.[id]){const c=copy(s);delete c.pres[id];put('sessions',c.id,c)}
    for(const m in cx.payments)if(cx.payments[m][id]){const c=copy(cx.payments[m]);delete c[id];put('payments',m,c)}for(const f of Object.values(cx.fees))if(f.ath===id)del('fees',f.id);UI.draft=null;closeSheet()},
  importList:()=>importSheet(),
  impTurma:d=>{UI.draft.turma=d.t;renderImp()},
  doImport:()=>{const rows=L.parseAthleteList(UI.draft.text);if(!rows.length){toast('Nada reconhecido');return}const k=K(),cx=ctx();let n=0,skip=0;
    for(const r of rows){const id=r.fnkp?'a'+r.fnkp:'n'+uid();if(cx.athletes[id]){skip++;continue}const a={id,fnkp:r.fnkp,nome:r.nome,nasc:r.nasc,curto:'',enc:'',tel:'',canal:'wa',notas:'',grau:'',irmaos:'',irmaoOutra:false,trazidoPor:'',insc:{}};
      const e=newEnr(null,k);e.turma=UI.draft.turma;const h=L.hist(CD().horarios,today());e.dias=[...new Set((h?.slots||[]).filter(s=>s.t===e.turma).map(s=>+s.wd))];e.freq[0].n=Math.min(2,e.dias.length||1);a.insc[k]=e;put('athletes',id,a);n++}
    toast(`${n} atletas importados${skip?` · ${skip} já existiam`:''}`);UI.draft=null;closeSheet()},
  conV:d=>{UI.con.v=d.v;render()},
  payCycle:d=>{const cd=CD(),k=K(),cx=ctx();const a=cx.athletes[d.id];const s=L.monthStatus(cd,a,cx,k,d.m);const pm=copy(cx.payments[d.m]||{});
    if(!s||['falta','semPres','isentoFixo'].includes(s.st))pm[d.id]={s:'P',v:L.monthValue(cd,a,cx,k,d.m).v,d:today()};else if(s.st==='pago')pm[d.id]={s:'I'};else delete pm[d.id];put('payments',d.m,pm)},
  payVal:d=>{const pm=copy(ctx().payments[d.m]||{});const p=pm[d.id];if(!p||p.s!=='P')return;const v=prompt('Valor pago (€)',p.v);if(v==null)return;const n=parseFloat(String(v).replace(',','.'));if(isNaN(n))return;p.v=n;put('payments',d.m,pm)},
  payMsg:d=>{const items=payItems(d.id,d.m);sendMsg(ctx().athletes[d.id],L.fill(META().msgs?.pag,msgVars(d.id,items,L.payDetail)))},
  remind:d=>{const items=L.dueList(CD(),ctx(),K(),UI.con.m).filter(x=>x.id===d.id).map(x=>({m:x.m,f:x.f,v:x.v}));sendMsg(ctx().athletes[d.id],L.fill(META().msgs?.lemb,msgVars(d.id,items,L.payDetail)))},
  newMov:()=>movDraft(null),editMov:d=>movDraft(d.id),movT:d=>{UI.draft.x.tipo=d.v;renderMov()},
  saveMov:()=>{const x=UI.draft.x;if(!x.v||isNaN(+x.v)){toast('Falta o valor');return}x.v=+x.v;if(!x.id)x.id='m'+uid();put('ledger',x.id,x);UI.draft=null;closeSheet()},
  delMov:()=>{if(!confirm('Apagar este movimento?'))return;del('ledger',UI.draft.x.id);UI.draft=null;closeSheet()},
  modPag:d=>{const c=copy(CD());c.cfg.modeloPag=d.v;saveClub(c)},
  recReg:d=>{const r=ctx().receitas[d.m];const prev=L.profMonth(CD(),ctx(),K(),d.m).prev;const v=prompt(`Valor recebido do ginásio em ${mLabel(d.m)} (€)`,r?r.valor:prev);if(v==null)return;if(v===''){del('receitas',d.m);return}
    const n=parseFloat(String(v).replace(',','.'));if(isNaN(n))return;const nota=n!==prev?(prompt('Nota (opcional), ex.: quem não contou',r?.nota||'')||''):'';put('receitas',d.m,{valor:n,data:today(),nota})},
  qv:d=>{UI.con.qv=d.v;render()},
  genQuotas:d=>quotaGen(d.y),
  feeCycle:d=>{const f=copy(ctx().fees[d.id]);const a=ctx().athletes[f.ath];if(f.estado==='falta'){f.estado='cobrado';f.v=L.quotaValue(META(),f.ano,f.item,f.red,a?.nasc,today());f.dCob=today()}else if(f.estado==='cobrado'){f.estado='entregue';f.dEnt=today()}else{f.estado='falta';delete f.v;delete f.dCob;delete f.dEnt}put('fees',f.id,f)},
  feeMsg:d=>{const fs=Object.values(ctx().fees).filter(f=>f.ath===d.id&&f.ano===d.y&&f.estado==='cobrado');const last=fs.map(f=>f.dCob).sort().pop();const items=fs.filter(f=>f.dCob===last).map(f=>({label:`${f.item==='seg'?'seguro':'quota da '+L.QITEMS.find(q=>q[0]===f.item)[1]} ${f.ano}`,v:f.v}));
    sendMsg(ctx().athletes[d.id],L.fill(META().msgs?.quota,{nome:N(d.id),clube:CD().nome,detalhe:L.feeDetail(items)}))},
  deliverAll:d=>{const fs=Object.values(ctx().fees).filter(f=>f.ano===d.y&&f.estado==='cobrado');if(!fs.length){toast('Nada cobrado por entregar');return}if(!confirm(`Marcar ${fs.length} quotas cobradas como entregues?`))return;fs.forEach(f=>put('fees',f.id,{...f,estado:'entregue',dEnt:today()}))},
  newEv:()=>evDraft(null),editEv:d=>evDraft(d.id),
  newEvA:()=>{evDraft(null);const m=UI.aul.m;if(m&&today().slice(0,7)!==m){UI.draft.ev.data=m+'-01';renderEv()}},
  evAlso:d=>{UI.draft.also=UI.draft.also||{};UI.draft.also[d.id]=!UI.draft.also[d.id];renderEv()},
  planMes:()=>planDraft(),
  doPlan:()=>{const d=UI.draft;const M=copy(META());M.frases=M.frases||{};M.frases[d.m]={texto:d.texto.trim(),autor:d.autor.trim()};api().putMeta(M);printMonth(d.m,M.frases[d.m])},
  evAth:d=>{const ev=UI.draft.ev;if(ev.atl[d.id])delete ev.atl[d.id];else ev.atl[d.id]={estado:'falta'};renderEv()},
  evCycle:d=>{const x=UI.draft.ev.atl[d.id];x.estado=x.estado==='falta'?'cobrado':x.estado==='cobrado'?'entregue':'falta';if(x.estado==='cobrado'){x.v=+UI.draft.ev.valor||0;x.d=today()}renderEv()},
  saveEv:()=>{const ev=UI.draft.ev;if(!ev.nome.trim()){toast('Falta o nome');return}ev.valor=+ev.valor||0;ev.pontos=+ev.pontos||0;if(!ev.id)ev.id='e'+uid();put('events',ev.id,ev);
    for(const cid in (UI.draft.also||{}))if(UI.draft.also[cid])api().put(cid,'events',ev.id,{...copy(ev),atl:{}});
    if(ev.tipo==='exame')for(const id in ev.atl){const g=ev.atl[id].grau;const a=ctx().athletes[id];if(g&&a&&a.grau!==g)put('athletes',id,{...copy(a),grau:g})}UI.draft=null;closeSheet()},
  delEv:()=>{if(!confirm('Apagar esta ocorrência?'))return;del('events',UI.draft.ev.id);UI.draft=null;closeSheet()},
  parab:d=>{const a=ctx().athletes[d.id];sendMsg(a,L.fill(META().msgs?.parab,{nome:nameOf(a),clube:CD().nome}))},
  ics:d=>{const cd=CD(),k=K();const as=athsIn(k,'',curMonth(k)).filter(a=>a.nasc);const exp=new Set(cd.icsExp||[]);const list=(d.v==='new'?as.filter(a=>!exp.has(a.id)):as).map(a=>({id:a.id,nome:nameOf(a),nasc:a.nasc,clube:cd.nome}));
    if(!list.length){toast('Nada para exportar');return}dl(`aniversarios-${cd.id}${d.v==='new'?'-novos':''}.ics`,L.icsBirthdays(list),'text/calendar');const c=copy(cd);c.icsExp=[...new Set([...(c.icsExp||[]),...list.map(x=>x.id)])];saveClub(c)},
  preT:d=>{UI.pre.t=d.t;render()},
  newAward:()=>awardDraft(),awT:d=>{const t=META().awardTypes.find(x=>x.id===d.id);UI.draft.tipo=t.id;UI.draft.pts=t.pts;renderAward()},awTurma:d=>{UI.draft.turma=d.t;renderAward()},awAth:d=>{UI.draft.sel[d.id]=!UI.draft.sel[d.id];renderAward()},
  saveAward:()=>{const d=UI.draft;const ids=Object.keys(d.sel).filter(x=>d.sel[x]);if(!ids.length){toast('Escolhe atletas');return}const t=META().awardTypes.find(x=>x.id===d.tipo)||{nome:'Prémio'};
    for(const ath of ids){const id='w'+uid();put('awards',id,{id,ath,tipo:d.tipo,nome:t.nome,pts:+d.pts||0,data:d.data,nota:d.nota})}toast(`+${d.pts} pts a ${ids.length} atleta(s)`);UI.draft=null;closeSheet()},
  delAward:d=>{if(confirm('Remover estes pontos?'))del('awards',d.id)},
  newTest:()=>newTest(),openTest:d=>openTest(d.id),
  tsTurma:d=>{const s=copy(ctx().tests[UI.tst.id]);s.turmas=s.turmas.includes(d.t)?s.turmas.filter(x=>x!==d.t):[...s.turmas,d.t];put('tests',s.id,s)},
  tsTeste:d=>{const s=copy(ctx().tests[UI.tst.id]);s.testes=s.testes.includes(d.id)?s.testes.filter(x=>x!==d.id):[...s.testes,d.id];put('tests',s.id,s)},
  tsTab:d=>{UI.tst.test=d.id;UI.sw.run=false;renderTest()},
  swMode:d=>{UI.sw.mode=d.v;UI.sw.run=false;renderTest()},
  swInd:d=>{const sw=UI.sw;if(sw.run&&sw.ath===d.id){const t=(performance.now()-sw.t0)/1000;sw.run=false;recordTime(d.id,t)}else{sw.run=true;sw.ath=d.id;sw.t0=performance.now();renderTest()}},
  swGo:()=>{const sw=UI.sw;if(sw.run){sw.run=false}else{sw.run=true;sw.t0=performance.now()}renderTest()},
  swLap:d=>{const sw=UI.sw;if(!sw.run){toast('Primeiro toca em Iniciar');return}recordTime(d.id,(performance.now()-sw.t0)/1000)},
  printTest:()=>printTest(),
  delTest:()=>{if(!confirm('Apagar esta sessão de testes?'))return;del('tests',UI.tst.id);closeSheet()},
  cfgModelo:d=>{UI.draft.c.modelo=d.v;render()},
  cfgAdd:d=>{const c=UI.draft.c.cfg;const m=today().slice(0,7);const def={valores:{desde:m,1:20,2:28},descontos:{tipo:'irmao',desde:m,v1:5,v2:5,meses:''},pctEspaco:{desde:m,v:40},poupMensal:{desde:m,v:20},pausas:{desde:today(),ate:today(),motivo:''}}[d.key];(c[d.key]=c[d.key]||[]).push(def);render()},
  cfgRm:d=>{UI.draft.c.cfg[d.key].splice(+d.i,1);render()},
  hoAdd:()=>{const c=UI.draft.c;const last=c.horarios[c.horarios.length-1];c.horarios.push({desde:today(),slots:copy(last?.slots||[])});render()},
  hoRm:d=>{UI.draft.c.horarios.splice(+d.hi,1);render()},
  hoSAdd:d=>{UI.draft.c.horarios[+d.hi].slots.push({t:UI.draft.c.turmas[0].id,wd:1,ini:'18:00',fim:'19:00'});render()},
  hoSRm:d=>{UI.draft.c.horarios[+d.hi].slots.splice(+d.si,1);render()},
  epMes:d=>{const ep=UI.draft.c.epocas[K()];ep.meses=(ep.meses||[]).includes(d.m)?ep.meses.filter(x=>x!==d.m):[...(ep.meses||[]),d.m].sort();render()},
  newSeason:()=>{const c=UI.draft.c;const k=String(Math.max(...Object.keys(c.epocas).map(Number))+1);if(!confirm('Criar a época '+seasonLabel(k)+'?'))return;
    const prevK=String(+k-1);let poup=0;if(c.modelo==='gestao'&&c.epocas[prevK])poup=L.poupanca(c,ctx(),prevK).saldo;
    c.epocas[k]={inicio:`${k}-09-01`,fim:`${+k+1}-07-31`,meses:(c.epocas[prevK]?.meses||[]).map(m=>L.addMonths(m,12)),poupInicial:poup};saveClub(c);UI.season[UI.club]=k;pref('season',UI.season);UI.draft=null;toast('Época criada');render()},
  saveCfg:()=>{const c=UI.draft.c;c.horarios.sort((a,b)=>a.desde<b.desde?-1:1);for(const r of (c.cfg.descontos||[]))if(r.meses==='')delete r.meses;saveClub(c);UI.draft=null;toast('Definições guardadas');render()},
  delClub:async()=>{const n=CD().nome;if(!confirm('Apagar o clube '+n+' com TODOS os atletas, aulas e contas?'))return;if(prompt('Escreve o nome do clube para confirmar')!==n)return;const id=UI.club;UI.club=null;UI.tab='hoje';UI.draft=null;await api().delClub(id);toast('Clube apagado')},
  mAdd:d=>{const m=UI.draft.m;const def={awardTypes:{id:'p'+uid(),nome:'',pts:5},assidTiers:{min:50,pts:1},tests:{id:'t'+uid(),nome:'',un:'',melhor:'max',tent:1,dec:0,prot:''}}[d.key];(m[d.key]=m[d.key]||[]).push(def);render()},
  mRm:d=>{if(!confirm('Remover?'))return;UI.draft.m[d.key].splice(+d.i,1);render()},
  mQAdd:()=>{const m=UI.draft.m;const ys=Object.keys(m.quotas||{}).sort();const y=ys.length?String(+ys[ys.length-1]+1):today().slice(0,4);const base=ys.length?copy(m.quotas[ys[ys.length-1]]):{fed:{},ass:{},seg:{}};(m.quotas=m.quotas||{})[y]=base;render()},
  saveMeta:()=>{api().putMeta(UI.draft.m);UI.draft=null;toast('Definições guardadas');render()},
  exportAll:()=>{const o={app:'wadosensei',v:1,date:today(),meta:DB.meta,clubs:{}};for(const cid in DB.clubs)o.clubs[cid]=DB.clubs[cid];dl(`wadosensei-backup-${today()}.json`,JSON.stringify(o),'application/json')},
  importJSON:()=>$('#importFile').click(),
  csvAtt:()=>{const cx=ctx();const rows=['data;turma;tipo;plano;fnkp;nome;estado'];Object.values(cx.sessions).sort((a,b)=>a.data<b.data?-1:1).forEach(s=>{for(const id in (s.pres||{})){const a=cx.athletes[id];rows.push([s.data,turma(s.turma).nome,s.tipo,s.plano||'',a?.fnkp||'',a?.nome||id,s.pres[id]].join(';'))}});dl(`${CD().id}-presencas.csv`,'﻿'+rows.join('\n'),'text/csv')},
  csvPay:()=>{const cx=ctx();const rows=['mes;fnkp;nome;estado;valor;data'];Object.keys(cx.payments).sort().forEach(m=>{for(const id in cx.payments[m]){const a=cx.athletes[id],p=cx.payments[m][id];rows.push([m,a?.fnkp||'',a?.nome||id,p.s==='P'?'PAGO':'ISENTO',p.v!=null?String(p.v).replace('.',','):'',p.d||''].join(';'))}});dl(`${CD().id}-mensalidades.csv`,'﻿'+rows.join('\n'),'text/csv')}
};
const I={pl:t=>{UI.draft[t.dataset.k]=t.value},athQ:t=>{UI.ath.q=t.value;$('#athList').innerHTML=athList()},af:t=>{UI.draft.a[t.dataset.k]=t.value},dr:t=>{UI.draft[t.dataset.k]=t.value},
  impT:t=>{UI.draft.text=t.value;$('#impPrev').textContent=L.parseAthleteList(t.value).length+' atleta(s) reconhecido(s)'},
  evf:t=>{UI.draft.ev[t.dataset.k]=t.value},mv:t=>{UI.draft.x[t.dataset.k]=t.value},awf:t=>{UI.draft[t.dataset.k]=t.value}};
const C={
  club:t=>{if(t.value==='__new'){t.value=UI.club;A.newClub();return}UI.club=t.value;pref('club',t.value);UI.draft=null;UI.con.m=null;UI.aul.m=null;_ctx=null;render()},
  season:t=>{UI.season[UI.club]=t.value;pref('season',UI.season);UI.con.m=null;UI.aul.m=null;UI.draft=null;render()},
  aulM:t=>{UI.aul.m=t.value;render()},conM:t=>{UI.con.m=t.value;render()},qa:t=>{UI.con.qa=t.value;render()},
  af:t=>{UI.draft.a[t.dataset.k]=t.value;if(t.dataset.k==='nasc')renderAth()},
  ef:t=>{UI.draft.a.insc[K()][t.dataset.k]=t.value;renderAth()},
  repoS:t=>{UI.draft.repoe[t.dataset.t]=t.value},
  evf:t=>{UI.draft.ev[t.dataset.k]=t.value;renderEv()},evGrau:t=>{UI.draft.ev.atl[t.dataset.id].grau=t.value},
  sessF:t=>{const s=getSess();s[t.dataset.k]=t.value.trim();if(t.dataset.k==='plano'&&s.plano&&s.estado!=='dada'&&s.tipo==='normal')s.estado='dada';saveSess(s)},
  tsF:t=>{const s=copy(ctx().tests[UI.tst.id]);s[t.dataset.k]=t.value;put('tests',s.id,s)},
  tsRes:t=>{const s=copy(ctx().tests[UI.tst.id]);s.res=s.res||{};const r=(s.res[t.dataset.id]=s.res[t.dataset.id]||{});const arr=(r[UI.tst.test]=r[UI.tst.test]||[]);const v=t.value.replace(',','.');arr[+t.dataset.n]=v===''?'':+v;for(let i=0;i<arr.length;i++)if(arr[i]==null)arr[i]='';put('tests',s.id,s)},
  cfgTop:t=>{UI.draft.c[t.dataset.k]=t.value},cfgTurma:t=>{UI.draft.c.turmas[+t.dataset.i][t.dataset.f]=t.value},
  cfgCfg:t=>{const v=t.value;UI.draft.c.cfg[t.dataset.k]=['entNome','poupNome','titulo','local','municipal'].includes(t.dataset.k)?v:(v===''?'':+v)},
  cfgRow:t=>{const v=t.value;const f=t.dataset.f;UI.draft.c.cfg[t.dataset.key][+t.dataset.i][f]=['1','2','v','v1','v2','meses'].includes(f)?(v===''?'':+v):v},
  hoDesde:t=>{UI.draft.c.horarios[+t.dataset.hi].desde=t.value},hoS:t=>{const s=UI.draft.c.horarios[+t.dataset.hi].slots[+t.dataset.si];s[t.dataset.f]=t.dataset.f==='wd'?+t.value:t.value},
  epF:t=>{const ep=UI.draft.c.epocas[K()];ep[t.dataset.k]=t.dataset.k==='poupInicial'?+t.value||0:t.value},
  mRow:t=>{const v=t.value,f=t.dataset.f;UI.draft.m[t.dataset.key][+t.dataset.i][f]=['nome','un','melhor','prot'].includes(f)?v:(v===''?'':+v)},
  mQ:t=>{const q=UI.draft.m.quotas[t.dataset.y];(q[t.dataset.it]=q[t.dataset.it]||{})[t.dataset.f]=+t.value||0},
  mGraus:t=>{UI.draft.m.graus=t.value.split('\n').map(s=>s.trim()).filter(Boolean)},mMsg:t=>{(UI.draft.m.msgs=UI.draft.m.msgs||{})[t.dataset.k]=t.value},
  importFile:t=>{const f=t.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{importBackup(JSON.parse(r.result))}catch(e){alert('Ficheiro inválido: '+e.message)}t.value=''};r.readAsText(f)}
};
async function importBackup(o){
  if(o.app==='wadosensei'){if(!confirm('Importar este backup? Os documentos com o mesmo identificador são substituídos.'))return;const ops=[];if(o.meta)ops.push({meta:true,data:o.meta});
    for(const cid in o.clubs){const c=o.clubs[cid];if(c.doc)ops.push({cid,data:c.doc});for(const col of ['athletes','sessions','payments','receitas','fees','events','ledger','awards','tests'])for(const id in (c[col]||{}))ops.push({cid,col,id,data:c[col][id]})}
    await api().bulk(ops);toast('Backup importado');return}
  // versão offline anterior (v1: um clube; v2: vários)
  const clubs=o.clubs?Object.values(o.clubs):o.athletes?[o]:null;if(!clubs)throw new Error('formato desconhecido');
  const src=clubs.find(c=>(c.nome||'').toLowerCase().includes(CD().nome.toLowerCase().split(' ')[0]))||clubs[0];
  if(!confirm(`Importar "${src.nome||'clube'}" da versão offline para ${CD().nome}?`))return;
  const tmap=n=>/adult/i.test(n)?'A':'C';const ops=[];const cid=UI.club;
  for(const id in src.athletes){const a=src.athletes[id];const insc={};for(const k in (src.seasons||{})){const e=src.seasons[k].enr?.[id];if(e)insc[k]={turma:tmap(e.turma),dias:e.dias||[],freq:[{desde:`${k}-09`,n:(e.dias||[]).length||1}],isento:!!e.isento,desde:e.desde||'',ate:e.ate||'',manual:[]}}
    const cur=ctx().athletes[id];ops.push({cid,col:'athletes',id,data:{...(cur||{}),id,fnkp:a.fnkp||'',nome:a.nome,nasc:a.nasc||'',curto:a.curto||'',enc:a.enc||'',tel:a.tel||'',canal:'wa',notas:a.notas||'',grau:a.grau||'',irmaos:a.irmaos||'',irmaoOutra:false,trazidoPor:'',insc:{...(cur?.insc||{}),...insc}}})}
  for(const key in (src.att||{})){const[d,tn]=key.split('|');const t=tmap(tn);const sid=`${d}_${t}`;const cur=ctx().sessions[sid];ops.push({cid,col:'sessions',id:sid,data:{...(cur||{id:sid,data:d,turma:t,ini:'',fim:'',tipo:'normal',plano:'',nota:''}),estado:'dada',pres:{...(cur?.pres||{}),...src.att[key]}}})}
  for(const m in (src.pay||{}))ops.push({cid,col:'payments',id:m,data:{...(ctx().payments[m]||{}),...src.pay[m]}});
  await api().bulk(ops);toast(`Importado: ${Object.keys(src.athletes).length} atletas`)}

document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const f=A[b.dataset.a];if(f){f(b.dataset,b,e)}});
document.addEventListener('input',e=>{const t=e.target,f=t.dataset&&I[t.dataset.i];if(f)f(t)});
document.addEventListener('change',e=>{const t=e.target,f=t.dataset&&C[t.dataset.c];if(f)f(t)});

