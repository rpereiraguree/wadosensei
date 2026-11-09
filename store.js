// Camada de dados: Firebase (Auth + Firestore com cache offline) ou modo demo (localStorage).
export const COLS=['athletes','sessions','payments','receitas','fees','events','ledger','awards','tests'];
export const DB={meta:null,metaLoaded:false,clubs:{},clubsLoaded:false,user:null,mode:'firebase',pending:0,error:''};
const emptyClub=()=>Object.fromEntries([['doc',null],...COLS.map(c=>[c,{}])]);
const clean=o=>JSON.parse(JSON.stringify(o,(k,v)=>k==='virtual'?undefined:v));
let onChange=()=>{},T=null;
const changed=()=>{clearTimeout(T);T=setTimeout(()=>onChange(),25)};
let A=null; // adaptador ativo

/* ---------- Firebase ---------- */
const V='10.12.2',B=`https://www.gstatic.com/firebasejs/${V}/`;
async function firebaseAdapter(cfg){
  const[{initializeApp},au,fs]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
  const app=initializeApp(cfg);const auth=au.getAuth(app);let db;
  try{db=fs.initializeFirestore(app,{localCache:fs.persistentLocalCache({tabManager:fs.persistentMultipleTabManager()})})}catch(e){db=fs.getFirestore(app)}
  let uid=null,subs=[],clubSubs={};
  const stop=()=>{subs.forEach(u=>u());subs=[];Object.values(clubSubs).forEach(a=>a.forEach(u=>u()));clubSubs={}};
  const track=p=>{DB.pending++;changed();p.catch(e=>{console.error(e);DB.error='Erro a gravar: '+(e.code||e.message)}).finally(()=>{DB.pending--;changed()})};
  const cdoc=(cid,col,id)=>col?fs.doc(db,'users',uid,'clubs',cid,col,id):fs.doc(db,'users',uid,'clubs',cid);
  function subscribeClub(cid){clubSubs[cid]=COLS.map(col=>fs.onSnapshot(fs.collection(db,'users',uid,'clubs',cid,col),snap=>{const m={};snap.forEach(d=>m[d.id]=d.data());if(DB.clubs[cid])DB.clubs[cid][col]=m;changed()},e=>console.error(col,e)))}
  function listen(){stop();DB.meta=null;DB.metaLoaded=false;DB.clubs={};DB.clubsLoaded=false;
    subs.push(fs.onSnapshot(fs.doc(db,'users',uid,'meta','config'),s=>{DB.meta=s.exists()?s.data():null;DB.metaLoaded=true;changed()},e=>{DB.error='Sem acesso aos dados: '+(e.code||e.message);changed()}));
    subs.push(fs.onSnapshot(fs.collection(db,'users',uid,'clubs'),snap=>{const ids=new Set();
      snap.forEach(d=>{ids.add(d.id);const c=DB.clubs[d.id]||(DB.clubs[d.id]=emptyClub());c.doc=d.data();if(!clubSubs[d.id])subscribeClub(d.id)});
      for(const id of Object.keys(DB.clubs))if(!ids.has(id)){(clubSubs[id]||[]).forEach(u=>u());delete clubSubs[id];delete DB.clubs[id]}
      DB.clubsLoaded=true;changed()},e=>{DB.error='Sem acesso aos dados: '+(e.code||e.message);changed()}))}
  au.onAuthStateChanged(auth,u=>{DB.user=u?{uid:u.uid,email:u.email,nome:u.displayName}:null;DB.authReady=true;if(u){uid=u.uid;listen()}else{stop();uid=null}changed()});
  au.getRedirectResult(auth).catch(()=>{});
  return{
    async login(){const p=new au.GoogleAuthProvider();try{await au.signInWithPopup(auth,p)}catch(e){if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment','auth/cancelled-popup-request'].includes(e.code))await au.signInWithRedirect(auth,p);else throw e}},
    logout:()=>au.signOut(auth),
    put(cid,col,id,data){const d=clean(data);if(col){(DB.clubs[cid]||(DB.clubs[cid]=emptyClub()))[col][id]=d}else{(DB.clubs[cid]||(DB.clubs[cid]=emptyClub())).doc=d}changed();track(fs.setDoc(cdoc(cid,col,id),d))},
    del(cid,col,id){if(col){delete DB.clubs[cid]?.[col]?.[id]}changed();track(fs.deleteDoc(cdoc(cid,col,id)))},
    putMeta(m){DB.meta=clean(m);changed();track(fs.setDoc(fs.doc(db,'users',uid,'meta','config'),DB.meta))},
    async bulk(ops){for(let i=0;i<ops.length;i+=400){const b=fs.writeBatch(db);for(const o of ops.slice(i,i+400)){const ref=o.meta?fs.doc(db,'users',uid,'meta','config'):cdoc(o.cid,o.col,o.id);o.del?b.delete(ref):b.set(ref,clean(o.data))}await b.commit()}},
    async delClub(cid){const c=DB.clubs[cid];const ops=[];if(c)for(const col of COLS)for(const id in c[col])ops.push({cid,col,id,del:true});ops.push({cid,del:true});await this.bulk(ops)}
  }}

/* ---------- Demo (localStorage) ---------- */
function demoAdapter(){const KEY='wadosensei_demo';
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({meta:DB.meta,clubs:DB.clubs}))}catch(e){}};
  try{const r=JSON.parse(localStorage.getItem(KEY)||'null');if(r){DB.meta=r.meta;DB.clubs=r.clubs||{}}}catch(e){}
  DB.metaLoaded=true;DB.clubsLoaded=true;DB.authReady=true;DB.user={uid:'demo',email:'modo demonstração',nome:'Demo'};
  const ensure=cid=>DB.clubs[cid]||(DB.clubs[cid]=emptyClub());
  return{login(){},logout(){localStorage.removeItem(KEY);location.href=location.pathname},
    put(cid,col,id,data){const d=clean(data);if(col)ensure(cid)[col][id]=d;else ensure(cid).doc=d;save();changed()},
    del(cid,col,id){if(col)delete DB.clubs[cid]?.[col]?.[id];save();changed()},
    putMeta(m){DB.meta=clean(m);save();changed()},
    async bulk(ops){for(const o of ops){if(o.meta){DB.meta=clean(o.data);continue}if(o.del){if(o.col)delete DB.clubs[o.cid]?.[o.col]?.[o.id];else delete DB.clubs[o.cid];continue}
      if(o.col)ensure(o.cid)[o.col][o.id]=clean(o.data);else ensure(o.cid).doc=clean(o.data)}save();changed()},
    async delClub(cid){delete DB.clubs[cid];save();changed()}}}

export async function init(cfg,cb,demo){onChange=cb;if(demo){DB.mode='demo';A=demoAdapter()}else{A=await firebaseAdapter(cfg)}changed();return A}
export const api=()=>A;
