// === boot.js ===

// ══════════════════════════════════════════════════════════════
// CONFETTI ENGINE
// ══════════════════════════════════════════════════════════════
(function(){
  const COLORS=['#5C7A6B','#B8860B','#276749','#2B6CB0','#6B46C1','#C53030','#B7791F','#C6F6D5','#BEE3F8','#FBF5E6'];
  let _particles=[], _rafId=null, _canvas=null, _ctx=null;

  function getCanvas(){
    if(!_canvas){
      _canvas=document.getElementById('confettiCanvas');
      _ctx=_canvas.getContext('2d');
    }
    return _canvas;
  }

  function resize(){
    const c=getCanvas();
    c.width=window.innerWidth;c.height=window.innerHeight;
  }

  function launch(count=80,originX=null,originY=null){
    resize();
    const c=getCanvas();
    c.style.display='block';
    const ox=originX!=null?originX:window.innerWidth/2;
    const oy=originY!=null?originY:window.innerHeight*0.4;
    for(let i=0;i<count;i++){
      const angle=(Math.random()-0.5)*Math.PI*1.6; // spread upward
      const speed=4+Math.random()*10;
      _particles.push({
        x:ox,y:oy,
        vx:Math.cos(angle)*speed,
        vy:Math.sin(angle)*speed-6,
        rot:Math.random()*360,
        rotV:(Math.random()-0.5)*8,
        w:7+Math.random()*6,h:4+Math.random()*4,
        color:COLORS[Math.floor(Math.random()*COLORS.length)],
        life:1,decay:0.012+Math.random()*0.01,
        shape:Math.random()<0.5?'rect':'circle'
      });
    }
    if(!_rafId)_rafId=requestAnimationFrame(tick);
  }

  function tick(){
    const c=getCanvas();const ctx=_ctx;
    ctx.clearRect(0,0,c.width,c.height);
    _particles=_particles.filter(p=>p.life>0);
    _particles.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.35; // gravity
      p.vx*=0.99; p.rot+=p.rotV; p.life-=p.decay;
      ctx.save();
      ctx.globalAlpha=Math.max(0,p.life);
      ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle=p.color;
      if(p.shape==='circle'){ctx.beginPath();ctx.arc(0,0,p.w/2,0,Math.PI*2);ctx.fill();}
      else{ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);}
      ctx.restore();
    });
    if(_particles.length>0){_rafId=requestAnimationFrame(tick);}
    else{_rafId=null;ctx.clearRect(0,0,c.width,c.height);c.style.display='none';}
  }

  window.launchConfetti=function(count,x,y){launch(count||80,x,y);};
  window.launchConfettiFromEl=function(el,count){
    const r=el?el.getBoundingClientRect():null;
    const x=r?(r.left+r.right)/2:null;
    const y=r?(r.top+r.bottom)/2:null;
    launch(count||90,x,y);
  };
})();

// ══════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════
function switchTab(name,btn){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('section-'+name).classList.add('active');
  if(btn)btn.classList.add('active');
  renderSection(name);
}
function renderSection(name){
  if(name==='dashboard')renderDash();
  else if(name==='expenses')renderExpenses();
  else if(name==='revenue')renderRevenue();
  else if(name==='loans')renderLoans();
  else if(name==='savings')renderSavings();
  else if(name==='calendar')renderCalendar();
  else if(name==='analytics')renderAnalytics();
  else if(name==='archive')renderArchive();
}

// ── MONTH NAV HELPERS ──
const MS_IDX={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
function keyToYM(k){const p=k.split(' ');return parseInt(p[1])*12+MS_IDX[p[0]];}
function currentRealYM(){const n=new Date();return n.getFullYear()*12+n.getMonth();}
function changeMonth(dir){
  const _cmb=document.getElementById('monthCompleteBanner');if(_cmb)_cmb.remove();_lastMonthComplete='';
  const keys=Object.keys(S.months);
  const idx=keys.indexOf(CMK)+dir;
  if(idx<0)return; // already at oldest
  // Allow navigating up to 6 months ahead of today for pre-planning
  const maxYM=currentRealYM()+6;
  if(idx>=keys.length){
    // At newest existing month — try to go further forward
    const nextYM=keyToYM(CMK)+1;
    if(nextYM>maxYM){showToast('Cannot plan more than 6 months ahead','warn-t');return;}
    // Create the next month automatically
    const nextMo=nextYM%12;const nextYr=Math.floor(nextYM/12);
    const nextKey=MS[nextMo]+' '+nextYr;
    if(!S.months[nextKey])S.months[nextKey]={weeks:[{items:[]},{items:[]},{items:[]},{items:[]}],revenue:[]};
    expandScheduledExpenses(nextKey);
    CMK=nextKey;S.currentMonthKey=CMK;
    persist();updateMonthLabel();tagFilter='';
    renderSection(getTab());updateHealth();renderMonthTags();
    return;
  }
  // Guard: never navigate to a stored month more than 6 ahead of today
  const targetYM=keyToYM(keys[idx]);
  if(targetYM>maxYM){showToast('Cannot plan more than 6 months ahead','warn-t');return;}
  CMK=keys[idx];S.currentMonthKey=CMK;
  persist();updateMonthLabel();tagFilter='';
  renderSection(getTab());updateHealth();
}
function updateMonthLabel(){document.getElementById('monthLabel').textContent=CMK;}

// ══════════════════════════════════════════════
// MONTH MANAGEMENT
// ══════════════════════════════════════════════
function switchToMonth(k){
  const maxYM=currentRealYM()+6;
  if(keyToYM(k)>maxYM){showToast('Cannot plan more than 6 months ahead','warn-t');return;}
  CMK=k;S.currentMonthKey=k;_lastMonthComplete='';
  const b=document.getElementById('monthCompleteBanner');if(b)b.remove();
  persist();updateMonthLabel();tagFilter='';renderExpenses();updateHealth();
}
function renderMonthTags(){
  const keys=Object.keys(S.months);
  const canDelete=keys.length>1;
  document.getElementById('monthTags').innerHTML=keys.map(k=>`<span class="month-tag${k===CMK?' active-month':''}" onclick="switchToMonth('${k}')">${k}<span class="no-print month-tag-actions"><span title="Archive ${k}" onclick="event.stopPropagation();confirmArchiveMonth('${k}')" style="opacity:.45;font-size:9px;cursor:pointer;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.45">&#128230;</span>${canDelete?`<span title="Delete ${k}" onclick="event.stopPropagation();confirmDeleteMonth('${k}')" style="opacity:.35;font-size:9px;cursor:pointer;color:var(--danger);" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.35">&#128465;</span>`:''}</span></span>`).join('');
}
let _deleteMonthTarget='';
function confirmDeleteMonth(k){
  if(Object.keys(S.months).length<=1){showToast('Cannot delete — keep at least one active month','warn-t');return;}
  _deleteMonthTarget=k;
  const isArchived=S.archivedMonths&&S.archivedMonths[k];
  document.getElementById('deleteMonthKey').textContent=k;
  document.getElementById('deleteMonthArchiveRow').style.display=isArchived?'flex':'none';
  document.getElementById('deleteMonthAlsoArchive').checked=false;
  document.getElementById('deleteMonthModal').classList.add('open');
  trapFocus(document.getElementById('deleteMonthModal'));
  setTimeout(()=>{const f=document.querySelector('#deleteMonthModal button');if(f)f.focus();},120);
}
function closeDeleteMonthModal(){
  releaseTrap(document.getElementById('deleteMonthModal'));
  document.getElementById('deleteMonthModal').classList.remove('open');
  _deleteMonthTarget='';
}
function executeDeleteMonth(){
  const k=_deleteMonthTarget;
  if(!k||!S.months[k]){closeDeleteMonthModal();return;}
  const alsoArchive=document.getElementById('deleteMonthAlsoArchive').checked;
  delete S.months[k];
  if(alsoArchive&&S.archivedMonths)delete S.archivedMonths[k];
  if(CMK===k){
    const remaining=Object.keys(S.months);
    CMK=remaining.length?remaining[remaining.length-1]:'';
    S.currentMonthKey=CMK;
  }
  persist();updateMonthLabel();renderExpenses();updateHealth();updateArchiveBadge();
  closeDeleteMonthModal();
  showToast(`✓ ${k} deleted`);
}
function openCloneModal(){document.getElementById('cloneModal').classList.add('open');
  trapFocus(document.getElementById('cloneModal'));
  setTimeout(()=>{const _f=document.querySelector('#cloneModal input');if(_f)_f.focus();},120);
  setTimeout(()=>{ const f=document.querySelector('#cloneModal input,#cloneModal select,#cloneModal textarea'); if(f)f.focus(); },120);}
function closeCloneModal(){releaseTrap(document.getElementById('cloneModal'));
  document.getElementById('cloneModal').classList.remove('open');}
function executeClone(){
  const doExp=document.getElementById('cloneExpenses').checked;
  const doRev=document.getElementById('cloneRevenue').checked;
  const keepPaid=document.getElementById('cloneKeepPaid').checked;
  closeCloneModal();
  cloneCurrentMonth(doExp,doRev,keepPaid);
}
function cloneCurrentMonth(doExp=true,doRev=true,keepPaid=false){
  const parts=CMK.split(' ');let mo=MS.indexOf(parts[0]),yr=parseInt(parts[1]);
  mo++;if(mo>11){mo=0;yr++;}
  const nk=mk(mo,yr);
  if(S.months[nk]){showToast(nk+' already exists','warn-t');return;}
  const newWeeks=doExp?deepClone(cw()).map(w=>({items:w.items.map(i=>({...i,paid:keepPaid?i.paid:false}))})):[{items:[]},{items:[]},{items:[]},{items:[]}];
  const newRev=doRev?deepClone(cr()).map(r=>({...r,received:keepPaid?r.received:false})):[];
  S.months[nk]={weeks:newWeeks,revenue:newRev};
  applyBudgetRollovers(CMK,nk);
  expandScheduledExpenses(nk);
  CMK=nk;S.currentMonthKey=nk;persist();updateMonthLabel();renderExpenses();updateHealth();showToast('✓ Cloned to '+nk);
}
function openNewMonthModal(){
  const monSel=document.getElementById('newMonSelMonth');
  const yrSel=document.getElementById('newMonSelYear');
  const cs=document.getElementById('cloneFromSel');

  // Populate month select
  monSel.innerHTML=MS.map((m,i)=>`<option value="${i}">${m}</option>`).join('');

  // Populate year select — current year to 2100
  const curYr=new Date().getFullYear();
  yrSel.innerHTML='';
  for(let y=curYr;y<=2100;y++) yrSel.innerHTML+=`<option value="${y}">${y}</option>`;

  // Default to the month after the latest existing month
  const existingKeys=Object.keys(S.months||{});
  let defMo=new Date().getMonth(), defYr=new Date().getFullYear();
  if(existingKeys.length){
    const latest=existingKeys.map(k=>{const p=k.split(' ');return{mo:MS.indexOf(p[0]),yr:parseInt(p[1])};})
      .sort((a,b)=>a.yr!==b.yr?a.yr-b.yr:a.mo-b.mo).pop();
    defMo=(latest.mo+1)%12;
    defYr=latest.mo===11?latest.yr+1:latest.yr;
  }
  monSel.value=defMo;
  yrSel.value=Math.min(defYr,2100);

  cs.innerHTML='<option value="blank">Blank (empty)</option>';
  Object.keys(S.months).forEach(k=>{cs.innerHTML+=`<option value="${k}">Clone from ${k}</option>`;});

  document.getElementById('newMonthModal').classList.add('open');
  trapFocus(document.getElementById('newMonthModal'));
  setTimeout(()=>monSel.focus(),120);
}
function closeNewMonthModal(){releaseTrap(document.getElementById('newMonthModal'));
  document.getElementById('newMonthModal').classList.remove('open');}
function createNewMonth(){
  const mo=parseInt(document.getElementById('newMonSelMonth').value);
  const yr=parseInt(document.getElementById('newMonSelYear').value);
  const from=document.getElementById('cloneFromSel').value;
  if(isNaN(mo)||isNaN(yr)){showToast('Select a month and year','warn-t');return;}
  const key=mk(mo,yr);
  if(keyToYM(key)>currentRealYM()+6){showToast('Cannot plan more than 6 months ahead','warn-t');return;}
  if(S.months[key]){showToast(key+' already exists','warn-t');closeNewMonthModal();return;}
  if(from==='blank'){S.months[key]={weeks:[{items:[]},{items:[]},{items:[]},{items:[]}],revenue:[]};}
  else{const src=S.months[from];S.months[key]={weeks:deepClone(src.weeks).map(w=>({items:w.items.map(i=>({...i,paid:false}))})),revenue:deepClone(src.revenue).map(r=>({...r,received:false}));};}
  expandScheduledExpenses(key);
  CMK=key;S.currentMonthKey=key;persist();updateMonthLabel();closeNewMonthModal();renderExpenses();updateHealth();showToast('✓ Created '+key);
}

// ══════════════════════════════════════════════
// BUDGET ENVELOPES
// ══════════════════════════════════════════════
function catTotalsForMonth(){
  const t={};cw().forEach(w=>w.items.forEach(i=>{const c=CAT_LABELS[getCat(i.name)];t[c]=(t[c]||0)+amt(i.amount);}));
  return t;
}
function renderEnvelopes(){
  const t=_cachedCatTotals||catTotalsForMonth();
  const grid=document.getElementById('envelopesGrid');
  if(!grid)return;
  if(!Object.keys(t).length){grid.innerHTML='<div style="padding:12px;color:var(--text-muted);font-size:12px;">No expenses this month — budget tracking will appear once you add items.</div>';return;}
  document.getElementById('envelopesGrid').innerHTML=Object.keys(S.budgets||BDFT).map(cat=>{
    const spent=t[cat]||0,cap=S.budgets[cat]||BDFT[cat]||500;
    const pct=Math.min(100,spent/cap*100);
    const over=pct>=100,warn=pct>=80&&pct<100;
    const col=over?'var(--danger)':warn?'var(--amber)':'var(--sage)';
    return`<div class="be${over?' over':warn?' warn':''}">
      <div class="be-lbl">${cat}<button class="be-edit" onclick="openEnvModal('${cat}')" title="Edit ${cat} budget" aria-label="Edit budget">edit</button></div>
      <div class="be-amt"><span class="be-spent" style="color:${col}">${fmt(spent)}</span><span class="be-cap">/ ${fmt(cap)}</span></div>
      <div class="pbar" style="height:6px;"><div class="pfill" style="width:${pct}%;background:${col};border-radius:3px;height:100%;transition:width .4s;"></div></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">
        <span style="font-size:10px;font-weight:600;padding:1px 5px;border-radius:8px;background:${over?'var(--danger-light)':warn?'var(--amber-light)':'var(--success-light)'};color:${col};">${pct.toFixed(0)}%</span>
        <label title="Roll unused budget to next month" style="display:flex;align-items:center;gap:3px;cursor:pointer;font-size:9px;color:var(--text-muted);">
          <input type="checkbox" ${(S.budgetRollover&&S.budgetRollover[cat])?'checked':''} onchange="toggleRollover('${cat}',this.checked)" style="accent-color:var(--sage);width:11px;height:11px;">
          rollover
        </label>
      </div>
    </div>`;
  }).join('');
}
function toggleRollover(cat,enabled){
  if(!S.budgetRollover)S.budgetRollover={};
  S.budgetRollover[cat]=enabled;
  persist(false);
  showToast(enabled?'Rollover enabled for '+cat:'Rollover disabled for '+cat);
}

// Called when cloning a month — applies unused budget surplus to new month caps
function applyBudgetRollovers(fromKey,toKey){
  if(!S.budgetRollover||!S.months[fromKey]||!S.months[toKey])return;
  const cats=Object.keys(S.budgetRollover).filter(c=>S.budgetRollover[c]);
  cats.forEach(cat=>{
    const cap=S.budgets[cat]||0;
    const spent=S.months[fromKey].weeks.reduce((sum,w)=>sum+w.items.filter(i=>CAT_LABELS[getCat(i.name)]===cat).reduce((s,i)=>s+i.amount,0),0);
    const surplus=Math.max(0,cap-spent);
    if(surplus>0){
      S.budgets[cat]=cap+surplus;
    }
  });
}

// ──────────────────────────────────────────────
// MONTH COMPLETE CHECK
// ──────────────────────────────────────────────
let _lastMonthComplete='';
function checkMonthComplete(){
  const allExpPaid=cw().every(w=>w.items.length===0||w.items.every(i=>i.paid));
  const allRevReceived=cr().length>0&&cr().every(r=>r.received);
  const totalItems=cw().reduce((s,w)=>s+w.items.length,0);
  if(allExpPaid&&allRevReceived&&totalItems>0&&_lastMonthComplete!==CMK){
    _lastMonthComplete=CMK;
    setTimeout(()=>{
      launchConfetti(180);
      showToast('🎊 '+CMK+' is complete — all paid & all income received!');
      // Show the month complete banner in expenses tab
      let banner=document.getElementById('monthCompleteBanner');
      if(!banner){
        banner=document.createElement('div');
        banner.id='monthCompleteBanner';
        banner.className='month-complete-banner no-print';
        banner.innerHTML='<span style="font-size:24px;">🎊</span><div><strong style="font-size:13px;color:var(--success);">'+CMK+' Complete!</strong><div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">All expenses paid and all income received.</div></div>';
        const _efEl=document.querySelector('.exp-footer');const footer=_efEl?_efEl.closest('.card'):null;
        if(footer)footer.parentNode.insertBefore(banner,footer);
      }
    },500);
  }
}

// ── KEYBOARD: Escape closes any open modal ──
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
  }
});

// ══════════════════════════════════════════════
// PWA SETUP — register static manifest + service worker
(function initPWA(){
  if('serviceWorker' in navigator && location.protocol !== 'file:'){
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  }
})();

// Handle physical keyboard on lock screen
document.addEventListener('keydown', function(e){
  if(document.getElementById('lockScreen').style.display!=='none'){
    if(e.key>='0'&&e.key<='9') lockKeyPress(e.key);
    else if(e.key==='Backspace') lockKeyPress('del');
    e.preventDefault();
  }
});

// ── ONLINE/OFFLINE INDICATOR ──
(function(){
  function showConnStatus(online){
    let bar=document.getElementById('connBar');
    if(!bar){
      bar=document.createElement('div');
      bar.id='connBar';
      bar.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:9999;font-size:12px;font-weight:600;text-align:center;padding:6px;transition:transform .3s;transform:translateY(100%)';
      document.body.appendChild(bar);
    }
    if(online){
      bar.style.background='var(--success)';
      bar.style.color='white';
      bar.textContent='✓ Back online';
      bar.style.transform='translateY(0)';
      setTimeout(()=>bar.style.transform='translateY(100%)',2500);
    } else {
      bar.style.background='var(--danger)';
      bar.style.color='white';
      bar.textContent='⚠ You\'re offline — data saved locally';
      bar.style.transform='translateY(0)';
    }
  }
  window.addEventListener('online',()=>showConnStatus(true));
  window.addEventListener('offline',()=>showConnStatus(false));
  if(!navigator.onLine) showConnStatus(false);
})();

// ══════════════════════════════════════════════
// RESET ALL DATA
// ══════════════════════════════════════════════
async function resetAllData(){
  // Wipe IndexedDB (state + PIN)
  try{
    if(!_idb) _idb=await openIDB().catch(()=>null);
    if(_idb){
      await new Promise(res=>{
        const tx=_idb.transaction([IDB_STORE,IDB_PIN_STORE],'readwrite');
        tx.objectStore(IDB_STORE).clear();
        tx.objectStore(IDB_PIN_STORE).clear();
        tx.oncomplete=res; tx.onerror=res;
      });
    }
  }catch(e){}
  // Wipe localStorage
  [SK,SK+'_migrated','finflow_onboarded',PIN_IDB_KEY,
   _CLAUDE_KEY,_OPENAI_KEY,_AI_PREF].forEach(k=>{
    try{localStorage.removeItem(k);}catch(e){}
  });
  // Blank state — no demo data
  const blankWeeks=[{items:[]},{items:[]},{items:[]},{items:[]}];
  S={
    loans:[],strategy:'avalanche',savings:[],
    budgets:{...BDFT},budgetRollover:{},financialGoals:[],customCategories:[],scheduledExpenses:[],
    darkMode:S?S.darkMode:false,archiveThreshold:6,archivedMonths:{},
    currency:{symbol:'$',code:'CAD',locale:'en-CA'},
    fxRates:{rates:{},fetchedAt:0,base:'CAD'},
    months:{[CMK]:{weeks:blankWeeks,revenue:[]}},
    currentMonthKey:CMK
  };
  await persist(false);
  // Reset UI
  document.getElementById('loanBadge').textContent='0';
  document.getElementById('demoBanner').style.display='none';
  document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
  updateClaudeBtn();
  renderDash();
  updateHealth();
  showToast('All data cleared. Starting fresh.');
  showOnboarding();
}

// ══════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════
(async function boot(){
  await initState();
  // Migrate localStorage to IDB if not yet done
  if(!localStorage.getItem(SK+'_migrated'))await migrateToIDB();
  await checkLock();
  migrateAmountsToCents();
  runAutoArchive();
  // Expand any quarterly/yearly scheduled expenses into current month
  expandScheduledExpenses(CMK);
  applyDark();
  updateMonthLabel();
// Set strategy buttons correctly
document.getElementById('btn-avalanche').classList.toggle('active',S.strategy==='avalanche');
document.getElementById('btn-snowball').classList.toggle('active',(S.strategy||'avalanche')==='snowball');
  renderDash();
  updateHealth();
  updateClaudeBtn();
  // Update loan badge on boot from saved data
  document.getElementById('loanBadge').textContent=S.loans.length;
  // Show demo banner or onboarding for first-time users
  checkDemoBanner();
  if(!localStorage.getItem('finflow_onboarded')) showOnboarding();
})();
