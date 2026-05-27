// === state.js ===

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
let S=null, CMK='', revWin=12, tagFilter='', _blurLk=false;
let _pendingDueWi=-1, _pendingDueIi=-1, _pendingSavIdx=-1, _pendingDelSavIdx=-1;
let _txnMode='deposit', _txnIdx=-1, _envCat='';
let _noteWi=-1, _noteIi=-1, _receiptWi=-1, _receiptIi=-1;
let _csvRows=[], _csvHeaders=[];

function mk(mo,yr){return MS[mo]+' '+yr;}

// ══════════════════════════════════════════════
// INDEXEDDB STORAGE ENGINE
// Wraps persist/initState — no other functions change
// Falls back to localStorage if IDB unavailable
// ══════════════════════════════════════════════
const IDB_NAME='FinFlow';const IDB_VERSION=2;const IDB_STORE='state';const IDB_PIN_STORE='meta';
let _idb=null;

function openIDB(){
  return new Promise((res,rej)=>{
    if(!window.indexedDB){rej(new Error('no IDB'));return;}
    const req=indexedDB.open(IDB_NAME,IDB_VERSION);
    req.onupgradeneeded=e=>{
      const db=e.target.result;
      const oldV=e.oldVersion;
      // v0 → v1/v2: create primary state store
      if(!db.objectStoreNames.contains(IDB_STORE)){
        db.createObjectStore(IDB_STORE);
      }
      // v1 → v2: add meta store for PIN hash and app metadata
      if(oldV<2&&!db.objectStoreNames.contains(IDB_PIN_STORE)){
        db.createObjectStore(IDB_PIN_STORE);
      }
      // Future migrations: add if(oldV<3){...} blocks here
    };
    req.onsuccess=e=>{res(e.target.result);};
    req.onerror=e=>{rej(e.target.error);};
  });
}

async function idbGet(key){
  // IDB hangs silently on file:// in Edge — use localStorage directly
  if(location.protocol==='file:')return localStorage.getItem(key);
  if(!_idb)_idb=await openIDB().catch(()=>null);
  if(!_idb)return localStorage.getItem(key);
  return new Promise((res,rej)=>{
    const tx=_idb.transaction(IDB_STORE,'readonly');
    const req=tx.objectStore(IDB_STORE).get(key);
    req.onsuccess=e=>{var _r=e.target.result;res(_r!==undefined?_r:null);};
    req.onerror=e=>rej(e.target.error);
  });
}

async function idbSet(key,val){
  // IDB hangs silently on file:// in Edge — use localStorage directly
  if(location.protocol==='file:'){try{localStorage.setItem(key,val);}catch(e){}return;}
  if(!_idb)_idb=await openIDB().catch(()=>null);
  if(!_idb){localStorage.setItem(key,val);return;}
  return new Promise((res,rej)=>{
    const tx=_idb.transaction(IDB_STORE,'readwrite');
    const req=tx.objectStore(IDB_STORE).put(val,key);
    req.onsuccess=()=>res();
    req.onerror=e=>rej(e.target.error);
  });
}

// Migrate from localStorage to IDB on first run
async function migrateToIDB(){
  const lsData=localStorage.getItem(SK);
  if(lsData){
    try{
      await idbSet(SK,lsData);
      localStorage.removeItem(SK);
      localStorage.setItem(SK+'_migrated','1');
    }catch(e){}
  }
}

function persist(toast=true){
  S.currentMonthKey=CMK;
  const json=JSON.stringify(S);
  // Update storage banner using blob size estimate
  const bytes=new Blob([json]).size;
  const alertEl=document.getElementById('storAlert');
  const msgEl=document.getElementById('storMsg');
  if(alertEl){
    // IDB has no practical limit; warn only if very large (>20MB)
    const pct=bytes/(20*1024*1024)*100;
    if(pct>80){alertEl.classList.add('show');if(msgEl)msgEl.textContent='Data is large ('+Math.round(bytes/1024)+'KB) — consider exporting a backup.';}
    else alertEl.classList.remove('show');
  }
  idbSet(SK,json).then(()=>{
    if(toast)showToast('✓ Saved');
  }).catch(()=>{
    try{localStorage.setItem(SK,json);if(toast)showToast('✓ Saved (local)');}
    catch(e){showToast('⚠ Save failed — tap Export to backup','err-t');}
  });
}

// ══════════════════════════════════════════════
// SAVINGS ↔ EXPENSE SYNC
// Ensures each goal's contribution appears as a Savings expense item
// in the current month's week 1 if not already present
// ══════════════════════════════════════════════
function syncSavingsExpenses(){
  // Sync savings contributions to current month week 1 only.
  // Uses a savingsGoalId tag on the expense item to prevent orphans on rename.
  const goals=S.savings||[];
  const w0=cw()[0];
  // Remove orphaned savings expense items (goal deleted or renamed)
  const validNames=new Set(goals.filter(g=>g.contribution>0).map(g=>g.name+' (Savings)'));
  // Remove items that were savings-linked but no longer valid
  w0.items=w0.items.filter(i=>!i._savingsItem||validNames.has(i.name));
  goals.forEach((g,gi)=>{
    if(g.contribution<=0) return;
    const expName=g.name+' (Savings)';
    const existing=w0.items.find(i=>i._savingsItem&&i.name===expName);
    if(!existing){
      w0.items.push({name:expName,amount:g.contribution,paid:false,dueDay:null,note:'',receipt:null,_savingsItem:true});
    } else {
      existing.amount=amt(g.contribution);
    }
  });
}

// ══════════════════════════════════════════════
// DARK MODE
// ══════════════════════════════════════════════
function toggleDark(){S.darkMode=!S.darkMode;applyDark();persist();}
function toggleMobileMenu(){var s=document.getElementById('mobileMenuSheet');var o=document.getElementById('mobileMenuOverlay');var open=s.style.display==='none';s.style.display=open?'block':'none';o.style.display=open?'block':'none';}
function applyDark(){
  document.body.classList.toggle('dark',!!S.darkMode);
  document.getElementById('dkBtn').textContent=S.darkMode?'☀':'☾';
}

// ══════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════
function showToast(msg,cls=''){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='toast show '+(cls||'');
  const dur=cls==='err-t'?5000:cls==='warn-t'?3500:2500;
  clearTimeout(window._tt);window._tt=setTimeout(()=>t.classList.remove('show'),dur);
}
function fmt(n){
  const cur=getCurrency();
  if(n==null||isNaN(n)||!isFinite(n))return cur.symbol+'0.00';
  return cur.symbol+Math.abs(n).toLocaleString(cur.locale,{minimumFractionDigits:2,maximumFractionDigits:2});
}
function getCurrency(){return(S&&S.currency&&S.currency.code)?S.currency:{symbol:'$',code:'CAD',locale:'en-CA'};}
function fmtSigned(n){return(n<0?'-':'')+fmt(Math.abs(n));}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function getCatLabel(catClass){
  if(catClass.startsWith('cat-custom-')){
    const id=catClass.replace('cat-custom-','');
    const cc=(S&&S.customCategories||[]).find(c=>c.id===id);
    return cc?cc.name:'Custom';
  }
  return CAT_LABELS[catClass]||'Other';
}
function getCatStyle(catClass){
  if(catClass.startsWith('cat-custom-')){
    const id=catClass.replace('cat-custom-','');
    const cc=(S&&S.customCategories||[]).find(c=>c.id===id);
    return cc?'background:'+cc.bg+';color:'+cc.color+';':'';
  }
  return '';
}
function fmtK(n){if(n==null)return fmt(0);return n>=1000?getCurrency().symbol+(Math.abs(n)/1000).toFixed(1)+'k':fmt(n);}
function deepClone(o){return JSON.parse(JSON.stringify(o));}
function getTab(){var _gs=document.querySelector('.section.active');return _gs?_gs.id.replace('section-',''):'dashboard';}
function cw(){return cm().weeks;}
function cr(){return cm().revenue;}
function cwSafe(wi){const w=cw();return(wi>=0&&wi<w.length)?w[wi]:null;}
function cm(){return S.months[CMK];}

function totalExp(k){const w=(k?S.months[k]:cm()).weeks;return Math.round(w.reduce((s,wk)=>s+wk.items.reduce((a,i)=>a+(amt(i.amount)),0),0)*100)/100;}
function paidExp(){return Math.round(cw().reduce((s,w)=>s+w.items.filter(i=>i.paid).reduce((a,i)=>a+amt(i.amount),0),0)*100)/100;}
function pendExp(){return Math.round((totalExp()-paidExp())*100)/100;}
function totalRev(k){return Math.round((k?S.months[k]:cm()).revenue.reduce((s,i)=>s+amt(i.amount),0)*100)/100;}
function totalDebt(){return Math.round(S.loans.reduce((s,l)=>s+amt(l.amount),0)*100)/100;}
function minPmts(){return Math.round(S.loans.reduce((s,l)=>s+amt(l.minPayment),0)*100)/100;}
function totalSav(){return Math.round((S.savings||[]).reduce((s,g)=>s+amt(g.balance),0)*100)/100;}


function isCents(x){ return Number.isInteger(x) && x > 100; } // heuristic: >100 = likely cents
function storeCents(dollars){
  if(dollars==null||String(dollars).trim()==='')return 0;
  const v=parseFloat(dollars);
  if(isNaN(v)||!isFinite(v))return 0;
  return Math.round(Math.min(9999999,Math.max(0,v))*100)/100;
}
function amt(x){
  // Dollar-float storage — amt() is now just a null-safe pass-through
  if(x==null||isNaN(x)||!isFinite(x))return 0;
  return x;
}
function migrateAmountsToCents(){
  // REVERTED: cent storage caused cascading display/calculation bugs.
  // All amounts stored as dollar floats. Round to 2dp at save time.
  // If a previous migration ran (S._centsFormat===true), convert back to dollars.
  if(S._centsFormat){
    const toDollar=val=>(val==null?0:Math.round(val)/100);
    Object.values(S.months).forEach(m=>{
      m.weeks.forEach(w=>w.items.forEach(i=>{ if(i.amount!==undefined) i.amount=toDollar(i.amount); }));
      m.revenue.forEach(r=>{ if(r.amount!==undefined) r.amount=toDollar(r.amount); });
    });
    Object.values(S.archivedMonths||{}).forEach(m=>{
      m.weeks.forEach(w=>w.items.forEach(i=>{ if(i.amount!==undefined) i.amount=toDollar(i.amount); }));
      m.revenue.forEach(r=>{ if(r.amount!==undefined) r.amount=toDollar(r.amount); });
    });
    S.loans.forEach(l=>{
      if(l.amount!==undefined) l.amount=toDollar(l.amount);
      if(l.originalAmount!==undefined) l.originalAmount=toDollar(l.originalAmount);
      if(l.minPayment!==undefined) l.minPayment=toDollar(l.minPayment);
    });
    (S.savings||[]).forEach(g=>{
      if(g.balance!==undefined) g.balance=toDollar(g.balance);
      if(g.target!==undefined) g.target=toDollar(g.target);
      if(g.contribution!==undefined) g.contribution=toDollar(g.contribution);
    });
    S._centsFormat=false;
    persist(false);
  }
}

async function initState(){
  // Try IDB first, fall back to localStorage
  let raw=null;
  try{raw=await idbGet(SK);}catch(e){}
  if(!raw)raw=localStorage.getItem(SK); // fallback
  if(raw){
    try{
      S=JSON.parse(raw);
      // Migrate: ensure all items have dueDay
      Object.values(S.months).forEach(m=>m.weeks.forEach(w=>w.items.forEach(i=>{if(i.dueDay===undefined)i.dueDay=null;if(i.note===undefined)i.note='';if(i.receipt===undefined)i.receipt=null;})));
      if(!S.savings) S.savings=[];
      if(!S.budgets) S.budgets={...BDFT};
      if(!S.archivedMonths) S.archivedMonths={};
      Object.values(S.archivedMonths).forEach(m=>m.weeks.forEach(w=>w.items.forEach(i=>{if(i.dueDay===undefined)i.dueDay=null;if(i.note===undefined)i.note='';if(i.receipt===undefined)i.receipt=null;})));
      if(S.archiveThreshold===undefined) S.archiveThreshold=6;
      // Currency — guard both existence AND shape (.code required)
      if(!S.currency||!S.currency.code) S.currency={symbol:'$',code:'CAD',locale:'en-CA'};
      if(!S.fxRates) S.fxRates={rates:{},fetchedAt:0,base:'CAD'};
      if(!S.budgetRollover) S.budgetRollover={};
      if(!S.financialGoals) S.financialGoals=[];
      if(!S.customCategories) S.customCategories=[];
      CMK=S.currentMonthKey||Object.keys(S.months)[0];
      return;
    }catch(e){}
  }
  S={loans:DL.map(l=>JSON.parse(JSON.stringify(l))),strategy:'avalanche',savings:JSON.parse(JSON.stringify(DSV)),budgets:{...BDFT},budgetRollover:{},financialGoals:[],customCategories:[],darkMode:false,archiveThreshold:6,archivedMonths:{},currency:{symbol:'$',code:'CAD',locale:'en-CA'},fxRates:{rates:{},fetchedAt:0,base:'CAD'},months:{'May 2026':{weeks:DW.map(w=>JSON.parse(JSON.stringify(w))),revenue:JSON.parse(JSON.stringify(DR))}},currentMonthKey:'May 2026'};
  CMK='May 2026';
  // Sync savings contributions as expense items in seed month
  syncSavingsExpenses();
  persist(false);
}

// ══════════════════════════════════════════════════════════════
// PIN / LOCK SCREEN
// PIN is hashed with SHA-256 via crypto.subtle before storage.
// The raw PIN is never stored — only the hex digest.
// ══════════════════════════════════════════════════════════════
const PIN_IDB_KEY = 'finflow_pin_hash';
let _lockBuffer = '';
let _setupBuffer = '';
let _setupStage = 'enter'; // 'enter' | 'confirm'
let _setupFirst = '';

async function hashPin(pin){
  const enc = new TextEncoder().encode(pin + 'finflow_salt_v1');
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function getPinHash(){
  try{
    if(location.protocol==='file:')return localStorage.getItem(PIN_IDB_KEY)||null;
    if(!_idb)_idb=await openIDB().catch(()=>null);
    if(!_idb)return localStorage.getItem(PIN_IDB_KEY)||null;
    return new Promise((res)=>{
      const tx=_idb.transaction(IDB_PIN_STORE,'readonly');
      const req=tx.objectStore(IDB_PIN_STORE).get(PIN_IDB_KEY);
      req.onsuccess=e=>res(e.target.result||null);
      req.onerror=()=>res(null);
    });
  }catch(e){return null;}
}

async function checkLock(){
  const hash = await getPinHash();
  if(!hash) return;
  document.getElementById('lockScreen').style.display='flex';
  document.body.style.overflow='hidden';
  const btn=document.getElementById('pinBtn');
  if(btn) btn.textContent='🔓';
}

async function verifyPin(){
  const hash = await hashPin(_lockBuffer);
  const stored = await getPinHash();
  if(hash===stored){
    document.getElementById('lockScreen').style.display='none';
    document.body.style.overflow='';
    _lockBuffer='';
    updateLockDots();
  } else {
    document.getElementById('lockError').textContent='Incorrect PIN — try again';
    document.getElementById('lockScreen').classList.add('pin-shake');
    setTimeout(()=>{document.getElementById('lockScreen').classList.remove('pin-shake');},400);
    _lockBuffer=''; updateLockDots();
  }
}

function lockKeyPress(key){
  const errEl=document.getElementById('lockError');
  errEl.textContent='';
  if(key==='del'){ _lockBuffer=_lockBuffer.slice(0,-1); updateLockDots(); return; }
  if(key==='bio'){ /* future: WebAuthn */ return; }
  if(_lockBuffer.length>=4) return;
  _lockBuffer+=key;
  updateLockDots();
  if(_lockBuffer.length===4) verifyPin();
}

function updateLockDots(){
  for(let i=0;i<4;i++){
    const d=document.getElementById('ld'+i);
    if(d) d.classList.toggle('filled', i<_lockBuffer.length);
  }
}

// ── PIN SETUP ──
function openPinSetup(){
  _setupBuffer=''; _setupStage='enter'; _setupFirst='';
  document.getElementById('pinSetupTitle').textContent='Set PIN';
  document.getElementById('pinSetupDesc').textContent='Choose a 4-digit PIN to protect your data.';
  document.getElementById('setupError').textContent='';
  updateSetupDots();
  // Show Remove PIN button if PIN already set
  getPinHash().then(h=>{
    document.getElementById('pinRemoveBtn').style.display=h?'block':'none';
  });
  document.getElementById('pinSetupModal').classList.add('open');
  trapFocus(document.getElementById('pinSetupModal'));
}

function closePinSetup(){
  releaseTrap(document.getElementById('pinSetupModal'));
  document.getElementById('pinSetupModal').classList.remove('open');
  _setupBuffer=''; _setupStage='enter'; _setupFirst='';
}

function setupKeyPress(key){
  if(key==='del'){ _setupBuffer=_setupBuffer.slice(0,-1); updateSetupDots(); return; }
  if(_setupBuffer.length>=4) return;
  _setupBuffer+=key;
  updateSetupDots();
  if(_setupBuffer.length===4){
    if(_setupStage==='enter'){
      _setupFirst=_setupBuffer;
      _setupBuffer='';
      _setupStage='confirm';
      document.getElementById('pinSetupTitle').textContent='Confirm PIN';
      document.getElementById('pinSetupDesc').textContent='Enter the same PIN again to confirm.';
      document.getElementById('setupError').textContent='';
      updateSetupDots();
    } else {
      confirmPinSetup();
    }
  }
}

function updateSetupDots(){
  for(let i=0;i<4;i++){
    const d=document.getElementById('sd'+i);
    if(d) d.classList.toggle('filled', i<_setupBuffer.length);
  }
}
