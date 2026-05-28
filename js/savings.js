// === savings.js ===

function renderSavings(){
  renderGoals();
  const goals=S.savings||[];
  const svTot=Math.round(goals.reduce((s,g)=>s+amt(g.balance),0)*100)/100;
  const estInt=Math.round(goals.reduce((s,g)=>s+amt(g.balance)*(g.rate/100),0)*100)/100;
  const mContrib=Math.round(goals.reduce((s,g)=>s+amt(g.contribution),0)*100)/100;
  const done=goals.filter(g=>amt(g.balance)>=amt(g.target)).length;
  document.getElementById('sv-total').textContent=fmt(svTot);
  document.getElementById('sv-done').textContent=done+' / '+goals.length;
  document.getElementById('sv-int').textContent=fmt(estInt);
  document.getElementById('sv-contrib').textContent=fmt(mContrib);

  const grid=document.getElementById('savingsGrid');
  if(!goals.length){
    grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text-muted);font-size:13px;border:2px dashed var(--border);border-radius:var(--radius);">No savings goals yet.<br><button class="nm-btn" style="margin-top:10px;" data-action="openSavModal" data-arg="-1">+ Add your first goal</button></div>`;
    dc('savChart');return;
  }
  grid.innerHTML=goals.map((g,i)=>{
    const pct=Math.min(100,amt(g.target)>0?amt(g.balance)/amt(g.target)*100:0);
    const moLeft=g.contribution>0&&amt(g.balance)<amt(g.target)?Math.ceil((amt(g.target)-amt(g.balance))/amt(g.contribution)):0;
    const projDate=moLeft>0?getPayoffDate(moLeft):'';
    const isComplete=pct>=100;
    return`<div class="sav-card${isComplete?' sav-complete':''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
        <div><div style="font-weight:700;font-size:13px;">${esc(g.name)}</div><div class="sav-interest">★ ${g.rate}% p.a. interest</div></div>
        <button class="del-btn" style="opacity:1;" data-action="openDelSav" data-arg="${i}" title="Delete savings goal" aria-label="Delete savings goal">✕</button>
      </div>
      <div style="font-family:'DM Mono',monospace;font-size:22px;font-weight:600;color:var(--blue);">${fmt(amt(g.balance))}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;">of ${fmt(amt(g.target))} goal</div>
      <div class="sav-goal-bar"><div class="sav-goal-fill" style="width:${pct}%;"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-top:3px;margin-bottom:10px;">
        <span>${pct.toFixed(0)}% complete</span>
        <span>${isComplete?'<span class="sav-complete-badge">🏆 Goal Reached!</span>':moLeft>0?projDate+' est.':''}</span>
      </div>
      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;">
        Monthly: ${fmt(amt(g.contribution))}/mo · Interest: ${fmt(amt(g.balance)*(g.rate/100/12))}/mo
      </div>
      <div class="sav-actions">
        <button class="tbtn" style="font-size:11px;padding:4px 9px;color:var(--success);border-color:var(--success-mid);" data-action="openTxnDeposit" data-arg="${i}">+ Deposit</button>
        <button class="tbtn" style="font-size:11px;padding:4px 9px;color:var(--amber);border-color:var(--amber-mid);" data-action="openTxnWithdraw" data-arg="${i}">− Withdraw</button>
        <button class="tbtn" style="font-size:11px;padding:4px 9px;" data-action="openSavModal" data-arg="${i}">Edit</button>
      </div>
      ${(g.transactions&&g.transactions.length)?`<details style="margin-top:8px;font-size:11px;"><summary style="cursor:pointer;color:var(--text-muted);font-size:10px;user-select:none;">History (${g.transactions.length})</summary><div style="margin-top:6px;max-height:140px;overflow-y:auto;">${g.transactions.slice(0,20).map(t=>`<div style="display:flex;justify-content:space-between;padding:3px 0;border-top:1px solid var(--border);"><span style="color:var(--text-muted);">${t.date}</span><span style="color:${t.type==='deposit'?'var(--success)':'var(--amber)'};">${t.type==='deposit'?'+':'-'}${fmt(t.amount)}</span></div>${t.note?`<div style="font-size:10px;color:var(--text-muted);padding-bottom:2px;">${esc(t.note)}</div>`:''}`).join('')}</div></details>`:''}
    </div>`;
  }).join('');

  // All savings goals complete banner
  const allSavComplete=goals.length>0&&goals.every(g=>amt(g.balance)>=amt(g.target));
  let sacBanner=document.getElementById('savAllCompleteBanner');
  if(allSavComplete){
    if(!sacBanner){
      sacBanner=document.createElement('div');
      sacBanner.id='savAllCompleteBanner';
      sacBanner.className='savings-all-complete';
      sacBanner.innerHTML='<span class="sac-icon">🏆</span><div class="sac-text"><strong>All Savings Goals Reached!</strong><span>Every goal is funded. Consider setting a new challenge or investing the surplus.</span></div>';
      const grid=document.getElementById('savingsGrid');
      if(grid&&grid.parentNode)grid.parentNode.insertBefore(sacBanner,grid);
    }
  } else if(sacBanner){sacBanner.remove();}
  renderSavingsChart(goals);
  renderDashSavings(goals);
}
function renderDashSavings(goals){
  const el=document.getElementById('dashSavingsList');
  if(!el)return;
  if(!goals||!goals.length){el.innerHTML='<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">No savings goals yet.</div>';return;}
  el.innerHTML=goals.map(g=>{
    const pct=Math.min(100,amt(g.target)>0?amt(g.balance)/amt(g.target)*100:0);
    const isComplete=pct>=100;
    const moLeft=g.contribution>0&&amt(g.balance)<amt(g.target)?Math.ceil((amt(g.target)-amt(g.balance))/amt(g.contribution)):0;
    return`<div class="prog-item-dash">
      <div class="prog-header">
        <span class="pn" style="${isComplete?'color:var(--success);':''}">${esc(g.name)}${isComplete?' 🏆':''}</span>
        <span class="pa">${fmt(amt(g.balance))} / ${fmt(amt(g.target))}</span>
      </div>
      <div class="prog-track"><div class="prog-fill-dash" style="width:${pct.toFixed(1)}%;background:${isComplete?'var(--success)':'var(--blue)'};"></div></div>
      <div class="prog-foot">${pct.toFixed(0)}% · ${isComplete?'Goal reached!':moLeft>0?moLeft+' months to go':'contributing '+fmt(amt(g.contribution))+'/mo'}</div>
    </div>`;
  }).join('');
}

// Savings goal modal (add/edit)
function openSavModal(idx){
  _pendingSavIdx=idx;
  document.getElementById('savModalTitle').textContent=idx<0?'Add Savings Goal':'Edit Savings Goal';
  const g=idx>=0?S.savings[idx]:{name:'',target:0,balance:0,contribution:0,rate:0};
  document.getElementById('savName').value=g.name;
  document.getElementById('savTarget').value=g.target?amt(g.target):'';
  document.getElementById('savBal').value=g.balance?amt(g.balance):'';
  document.getElementById('savContrib').value=g.contribution?amt(g.contribution):'';
  document.getElementById('savRate').value=g.rate||'';
  const _sm=document.getElementById('savModal');
  _sm.classList.add('open');
  trapFocus(_sm);
  setTimeout(()=>{const f=document.getElementById('savName');if(f)f.focus();},120);
}
function closeSavModal(){releaseTrap(document.getElementById('savModal'));
  document.getElementById('savModal').classList.remove('open');}
function saveSavGoal(){
  const g={name:document.getElementById('savName').value||'Savings',target:storeCents(document.getElementById('savTarget').value),balance:storeCents(document.getElementById('savBal').value),contribution:storeCents(document.getElementById('savContrib').value),rate:parseFloat(document.getElementById('savRate').value)||0};
  if(!S.savings)S.savings=[];
  const alreadyMet=amt(g.target)>0&&amt(g.balance)>=amt(g.target);
  const wasEdit=_pendingSavIdx>=0;
  if(wasEdit)S.savings[_pendingSavIdx]=g;else S.savings.push(g);
  syncSavingsExpenses();
  try{persist();}catch(e){showToast("✗ Could not save goal","err-t");}closeSavModal();renderSavings();updateHealth();
  if(alreadyMet&&!wasEdit){
    setTimeout(()=>{launchConfetti(140);showToast('🏆 Savings goal already reached: '+g.name);},200);
  }
}
function openDelSav(i){_pendingDelSavIdx=i;document.getElementById('delSavName').textContent='Delete "'+S.savings[i].name+'"? This cannot be undone.';document.getElementById('delSavModal').classList.add('open');
  trapFocus(document.getElementById('delSavModal'));
  setTimeout(()=>{const _f=document.querySelector('#delSavModal button');if(_f)_f.focus();},120);}
function closeDelSav(){releaseTrap(document.getElementById('delSavModal'));
  document.getElementById('delSavModal').classList.remove('open');}
function confirmDelSav(){S.savings.splice(_pendingDelSavIdx,1);persist();closeDelSav();renderSavings();updateHealth();}

// Deposit / Withdraw modal
function openTxn(mode,idx){
  _txnMode=mode;_txnIdx=idx;
  const g=S.savings[idx];
  document.getElementById('txnTitle').textContent=mode==='deposit'?'Deposit to '+g.name:'Withdraw from '+g.name;
  document.getElementById('txnGoalName').textContent='Current balance: '+fmt(amt(g.balance));
  document.getElementById('txnAmount').value='';
  document.getElementById('txnNote').value='';
  document.getElementById('txnWarnRow').style.display='none';
  document.getElementById('txnConfirmBtn').textContent=mode==='deposit'?'Confirm Deposit':'Confirm Withdrawal';
  document.getElementById('txnConfirmBtn').style.background=mode==='deposit'?'var(--sage)':'var(--amber)';
  document.getElementById('txnModal').classList.add('open');
  trapFocus(document.getElementById('txnModal'));
  setTimeout(()=>{const _f=document.querySelector('#txnModal input');if(_f)_f.focus();},120);
}
function closeTxnModal(){releaseTrap(document.getElementById('txnModal'));
  document.getElementById('txnModal').classList.remove('open');}
function confirmTxn(){
  const a=parseFloat(document.getElementById('txnAmount').value)||0;
  if(a<=0){showToast('Enter an amount','warn-t');return;}
  if(_txnMode==='custom_goal'){
    const wasMet=S.financialGoals[_txnIdx]&&(S.financialGoals[_txnIdx].customTarget>0)&&(S.financialGoals[_txnIdx].customCurrent>=S.financialGoals[_txnIdx].customTarget);
    S.financialGoals[_txnIdx].customCurrent=a;
    const nowMet=S.financialGoals[_txnIdx].customTarget>0&&a>=S.financialGoals[_txnIdx].customTarget;
    persist();closeTxnModal();renderSavings();updateHealth();
    if(!wasMet&&nowMet){setTimeout(()=>{launchConfetti(130);showToast('🏆 Goal reached: '+S.financialGoals[_txnIdx].name);},200);}
    else showToast('✓ Progress updated');
    return;
  }
  const g=S.savings[_txnIdx];
  if(!g){closeTxnModal();return;}
  const prevPct=amt(g.target)>0?amt(g.balance)/amt(g.target):0;
  const aAmt=Math.round(a*100)/100;
  if(_txnMode==='deposit'){g.balance=Math.round((amt(g.balance)+aAmt)*100)/100;}
  else{
    if(aAmt>amt(g.balance)){g.balance=0;showToast('Balance set to $0');}
    else g.balance=Math.round((amt(g.balance)-aAmt)*100)/100;
  }
  if(!g.transactions)g.transactions=[];
  g.transactions.unshift({
    date:new Date().toISOString().slice(0,10),
    type:_txnMode,
    amount:aAmt,
    note:document.getElementById('txnNote').value.trim(),
    balance:g.balance
  });
  const newPct=g.target>0?g.balance/g.target:0;
  persist();closeTxnModal();renderSavings();updateHealth();
  if(_txnMode==='deposit'&&prevPct<1&&newPct>=1){
    setTimeout(()=>{launchConfetti(160);showToast('🏆 Savings goal reached: '+g.name);},200);
  } else {
    showToast('✓ '+ (_txnMode==='deposit'?'Deposited':'Withdrew')+' '+fmt(a));
  }
}
// Warn on withdraw
document.getElementById('txnAmount').addEventListener('input',function(){
  if(_txnMode==='withdraw'&&_txnIdx>=0&&S.savings[_txnIdx]){const a=parseFloat(this.value)||0;document.getElementById('txnWarnRow').style.display=(a>0&&a>amt(S.savings[_txnIdx].balance))?'block':'none';}
});

// ══════════════════════════════════════════════
// FINANCIAL GOALS
// ══════════════════════════════════════════════
let _goalEditIdx=-1;

function openGoalModal(idx){
  _goalEditIdx=idx;
  document.getElementById('goalModalTitle').textContent=idx<0?'Add Financial Goal':'Edit Goal';
  const g=idx>=0?S.financialGoals[idx]:{type:'payoff',name:'',target:0,targetDate:'',category:'',monthlyAmount:0,months:6,customDesc:'',customTarget:0,customCurrent:0,customUnit:''};
  document.getElementById('goalType').value=g.type||'payoff';
  document.getElementById('goalName').value=g.name||'';
  updateGoalTypeUI(g);
  document.getElementById('goalModal').classList.add('open');
  trapFocus(document.getElementById('goalModal'));
  setTimeout(()=>{const _f=document.querySelector('#goalModal select');if(_f)_f.focus();},120);
}
function closeGoalModal(){releaseTrap(document.getElementById('goalModal'));
  document.getElementById('goalModal').classList.remove('open');}

function updateGoalTypeUI(existing){
  const type=document.getElementById('goalType').value;
  const g=existing||{};
  let html='';
  if(type==='payoff'){
    html=`<div class="fr" style="margin-bottom:9px;">
      <div class="fg"><label for="gTarget" class="fl">Target Balance ($)</label><input class="fi" id="gTarget" aria-label="Target amount" type="number" value="${g.target||0}" placeholder="0"></div>
      <div class="fg"><label for="gDate" class="fl">Target Date</label><input class="fi" id="gDate" aria-label="Target date" type="month" value="${g.targetDate||''}"></div>
    </div>
    <div class="fg" style="margin-bottom:9px;"><label for="gLinkedLoan" class="fl">Linked Loan (optional)</label>
      <select class="fi" id="gLinkedLoan"><option value="">None</option>${S.loans.map((l,i)=>'<option value="'+i+'" '+(g.linkedLoan===i?'selected':'')+'>'+l.name+'</option>').join('')}</select>
    </div>`;
  } else if(type==='spend'){
    html=`<div class="fr" style="margin-bottom:9px;">
      <div class="fg"><label for="gMonthlyCap" class="fl">Monthly Cap ($)</label><input class="fi" id="gMonthlyCap" aria-label="Monthly spending cap" type="number" value="${g.monthlyCap||300}" placeholder="300"></div>
      <div class="fg"><label for="gCategory" class="fl">Category</label>
        <select class="fi" id="gCategory">${Object.keys(BDFT).map(c=>'<option value="'+c+'" '+(g.category===c?'selected':'')+'>'+c+'</option>').join('')}</select>
      </div>
    </div>
    <div class="fg" style="margin-bottom:9px;"><label for="gMonths" class="fl">Track for (months)</label><input class="fi" id="gMonths" aria-label="Number of months" type="number" value="${g.months||3}" placeholder="3"></div>`;
  } else if(type==='save'){
    html=`<div class="fr" style="margin-bottom:9px;">
      <div class="fg"><label for="gMonthlyAmt" class="fl">Monthly Savings Amount ($)</label><input class="fi" id="gMonthlyAmt" aria-label="Monthly savings amount" type="number" value="${g.monthlyAmount||500}" placeholder="500"></div>
      <div class="fg"><label for="gMonthsSave" class="fl">Consecutive Months</label><input class="fi" id="gMonthsSave" aria-label="Consecutive months" type="number" value="${g.months||6}" placeholder="6"></div>
    </div>`;
  } else {
    // custom type
    html=`<div class="fg" style="margin-bottom:9px;"><label for="gCustomDesc" class="fl">What does success look like?</label>
      <textarea class="fi" id="gCustomDesc" rows="2" style="resize:vertical;">${g.customDesc||''}</textarea></div>
    <div class="fr" style="margin-bottom:9px;">
      <div class="fg"><label for="gCustomTarget" class="fl">Target Value (optional)</label><input class="fi" id="gCustomTarget" aria-label="Target value" type="number" value="${g.customTarget||''}" placeholder="e.g. 100"></div>
      <div class="fg"><label for="gCustomCurrent" class="fl">Current Value</label><input class="fi" id="gCustomCurrent" aria-label="Current value" type="number" value="${g.customCurrent||0}" placeholder="0"></div>
    </div>
    <div class="fg" style="margin-bottom:9px;"><label for="gCustomUnit" class="fl">Unit (optional, e.g. days, km, %)</label>
      <input class="fi" id="gCustomUnit" aria-label="Unit" value="${g.customUnit||''}" placeholder="e.g. %, days, km"></div>
    <p style="font-size:11px;color:var(--text-muted);margin-top:4px;">Track anything: habits, steps, streak days, custom milestones.</p>`;
  }
  document.getElementById('goalTypeFields').innerHTML=html;
}

function saveGoal(){
  const type=document.getElementById('goalType').value;
  const name=document.getElementById('goalName').value||'Goal';
  let g={type,name,createdMonth:CMK,progress:0};
  if(type==='payoff'){
    g.target=parseFloat(document.getElementById('gTarget').value)||0;
    g.targetDate=document.getElementById('gDate').value||'';
    const _glEl=document.getElementById('gLinkedLoan');const ll=_glEl?_glEl.value:undefined;
    if(ll!=='')g.linkedLoan=parseInt(ll);
  } else if(type==='spend'){
    g.monthlyCap=parseFloat(document.getElementById('gMonthlyCap').value)||300;
    g.category=document.getElementById('gCategory').value;
    g.months=parseInt(document.getElementById('gMonths').value)||3;
  } else if(type==='save'){
    g.monthlyAmount=parseFloat(document.getElementById('gMonthlyAmt').value)||500;
    g.months=parseInt(document.getElementById('gMonthsSave').value)||6;
  } else {
    // custom
    g.customDesc=(document.getElementById('gCustomDesc')||{}).value||'';
    g.customTarget=parseFloat((document.getElementById('gCustomTarget')||{}).value)||0;
    g.customCurrent=parseFloat((document.getElementById('gCustomCurrent')||{}).value)||0;
    g.customUnit=(document.getElementById('gCustomUnit')||{}).value||'';
  }
  if(!S.financialGoals)S.financialGoals=[];
  if(_goalEditIdx>=0)S.financialGoals[_goalEditIdx]=g;else S.financialGoals.push(g);
  persist();closeGoalModal();renderGoals();
  // Fire confetti if a debt payoff goal is already met on creation/edit
  if(g.type==='payoff'){
    const linkedLoan=g.linkedLoan!==undefined?S.loans[g.linkedLoan]:null;
    const cur=linkedLoan?linkedLoan.amount:g.target;
    if(cur<=0) setTimeout(()=>{launchConfetti(130);showToast('🏆 Debt paid off!');},300);
  }
}

function renderGoals(){
  const goals=S.financialGoals||[];
  const grid=document.getElementById('goalsGrid');
  if(!grid)return;
  if(!goals.length){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--text-muted);font-size:12px;border:2px dashed var(--border);border-radius:var(--radius);">No financial goals yet. Add a goal to track your targets.</div>';
    return;
  }
  grid.innerHTML=goals.map((g,i)=>{
    let progress=0,detail='',met=false,barColor='';
    if(g.type==='payoff'){
      const loan=g.linkedLoan!==undefined?S.loans[g.linkedLoan]:null;
      const cur=loan?loan.amount:g.target;
      const orig=loan?loan.originalAmount:g.target;
      progress=orig>0?Math.min(100,((orig-cur)/orig)*100):0;
      met=cur<=0;detail=loan?'Balance: '+fmt(cur):'Target: '+fmt(amt(g.target));
      barColor='var(--danger)';
    } else if(g.type==='spend'){
      const spent=cw().reduce((s,w)=>s+w.items.filter(it=>CAT_LABELS[getCat(it.name)]===g.category).reduce((a,it)=>a+it.amount,0),0);
      const cap=g.monthlyCap||1;
      progress=Math.min(100,(spent/cap)*100);
      met=spent<=cap;detail=fmt(spent)+' / '+fmt(cap)+' this month';
      barColor=progress>=100?'var(--danger)':progress>=80?'var(--amber)':'var(--success)';
    } else if(g.type==='save'){
      const months=Object.keys(S.months);
      const goodMonths=months.filter(mk=>{
        const monthRev=S.months[mk].revenue.reduce((s,r)=>s+r.amount,0);
        const monthExp=S.months[mk].weeks.reduce((s,w)=>s+w.items.reduce((a,it)=>a+it.amount,0),0);
        return(monthRev-monthExp)>=g.monthlyAmount;
      }).length;
      progress=Math.min(100,(goodMonths/(g.months||1))*100);
      met=goodMonths>=(g.months||1);detail=goodMonths+' / '+(g.months||1)+' months achieved';
      barColor='var(--blue)';
    } else {
      // custom goal
      const cur=g.customCurrent||0;const tgt=g.customTarget||0;
      progress=tgt>0?Math.min(100,(cur/tgt)*100):cur>0?100:0;
      met=tgt>0?cur>=tgt:false;
      const unit=esc(g.customUnit||'');
      detail=tgt>0?(cur+unit+' / '+tgt+unit):(cur>0?'Current: '+cur+unit:'Not started');
      barColor='var(--purple)';
    }
    const typeLabels={payoff:'Debt Payoff',spend:'Spending Cap',save:'Save Consistently',custom:'Custom Goal'};
    return`<div class="goal-card type-${g.type}${met?' type-met goal-celebrating':''}">
      <div class="g-type">${typeLabels[g.type]||g.type}</div>
      <div class="g-name">${esc(g.name)}</div>
      <div class="g-progress">${progress.toFixed(0)}%</div>
      <div class="g-bar"><div class="g-fill" style="width:${progress}%;background:${barColor};"></div></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
        <span style="font-size:11px;color:var(--text-secondary);">${detail}</span>
        <span class="${met?'sav-complete-badge':'goal-status-badge goal-unmet'}">${met?'🏆 Goal Met!':'⏳ In progress'}</span>
      </div>
      <div style="margin-top:8px;display:flex;gap:5px;flex-wrap:wrap;" class="no-print">
        ${g.type==='custom'?`<button class="tbtn" style="font-size:10px;padding:3px 7px;color:var(--purple);border-color:var(--purple-light);" data-action="logCustomGoalProgress" data-arg="${i}">+ Log Progress</button>`:''}
        <button class="tbtn" style="font-size:10px;padding:3px 7px;" data-action="openGoalModal" data-arg="${i}">Edit</button>
        <button class="tbtn" style="font-size:10px;padding:3px 7px;color:var(--danger);" data-action="deleteGoal" data-arg="${i}">Delete</button>
      </div>
    </div>`;
  }).join('');
}

function logCustomGoalProgress(i){
  const g=S.financialGoals[i];
  if(!g||g.type!=='custom')return;
  const unit=g.customUnit||'';
  const cur=g.customCurrent||0;
  const tgt=g.customTarget;
  // Use a simple input modal approach via a quick inline prompt using txnModal repurposed
  _txnIdx=i;_txnMode='custom_goal';
  document.getElementById('txnTitle').textContent='Log Progress — '+g.name;
  document.getElementById('txnGoalName').textContent=(tgt?'Target: '+tgt+unit+' · ':'')+'Current: '+cur+unit;
  document.getElementById('txnAmount').value=cur;
  document.getElementById('txnAmount').placeholder='Enter new value';
  document.getElementById('txnNote').value='';
  document.getElementById('txnNote').placeholder='Optional note';
  document.getElementById('txnWarnRow').style.display='none';
  document.getElementById('txnConfirmBtn').textContent='Update Progress';
  document.getElementById('txnConfirmBtn').style.background='var(--purple)';
  document.getElementById('txnModal').classList.add('open');
  trapFocus(document.getElementById('txnModal'));
  setTimeout(()=>{const _f=document.querySelector('#txnModal input');if(_f)_f.focus();},120);
}
function deleteGoal(i){
  S.financialGoals.splice(i,1);persist();renderGoals();showToast('Goal deleted');
}
