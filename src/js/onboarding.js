// === onboarding.js ===

// ══════════════════════════════════════════════
// ONBOARDING WIZARD
// ══════════════════════════════════════════════
let _obPin='', _obPinFirst='', _obPinPhase='enter';
let _obIncome=[], _obExpenses=[], _obLoans=[], _obSavings=[];
let _obReceiptData=null;
const OB_TOTAL=8;

function showOnboarding(){
  const sel=document.getElementById('obCurrency');
  sel.innerHTML=Object.keys(CURRENCY_MAP).map(code=>`<option value="${code}"${code==='CAD'?' selected':''}>${code} — ${CURRENCY_MAP[code].symbol}</option>`).join('');
  _obIncome=[]; _obExpenses=[]; _obLoans=[]; _obSavings=[]; _obReceiptData=null;
  obRenderIncome(); obRenderExpenses(); obRenderLoans(); obRenderSavings();
  document.getElementById('obExpReceiptLabel').textContent='📷 Tap to attach image';
  document.getElementById('obExpReceipt').value='';
  document.getElementById('obExpNote').value='';
  document.getElementById('obExpDue').value='';
  document.getElementById('obExpWeek').value='0';
  obGoTo(0);
  document.getElementById('onboardOverlay').style.display='flex';
  document.body.style.overflow='hidden';
  setTimeout(()=>{const f=document.getElementById('obStep0').querySelector('button');if(f)f.focus();},120);
}

function obGoTo(step){
  for(let i=0;i<OB_TOTAL;i++){
    document.getElementById('obStep'+i).style.display='none';
    const dot=document.getElementById('obDot'+i);
    dot.classList.remove('active','done');
    if(i<step) dot.classList.add('done');
    else if(i===step) dot.classList.add('active');
  }
  document.getElementById('obStep'+step).style.display='block';
  if(step===2||step===3||step===4||step===5) obSyncPrefixes();
  if(step===3){
    _obReceiptData=null;
    document.getElementById('obExpReceiptLabel').textContent='📷 Tap to attach image';
    document.getElementById('obExpReceipt').value='';
  }
  if(step===6){
    _obPin=''; _obPinFirst=''; _obPinPhase='enter';
    document.getElementById('obPinPhaseLabel').textContent='Enter a new PIN';
    document.getElementById('obPinErr').textContent='';
    obUpdatePinDots();
  }
  setTimeout(()=>{const f=document.querySelector('#obStep'+step+' input, #obStep'+step+' select, #obStep'+step+' button');if(f)f.focus();},80);
}

function obGetSym(){
  const code=document.getElementById('obCurrency').value;
  return (CURRENCY_MAP[code]&&CURRENCY_MAP[code].symbol)||'$';
}

function obSyncPrefixes(){
  const sym=obGetSym();
  ['obAmtPrefix','obExpPrefix','obLoanPrefix','obLoanMinPrefix','obSavPrefix','obSavBalPrefix','obSavContribPrefix'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.textContent=sym;
  });
}

function obUpdateAmtPrefix(){
  obSyncPrefixes();
}

function obSaveIncome(){
  document.getElementById('obIncomeErr').textContent='';
  obGoTo(3);
}

// ── Income ──
function obAddIncome(){
  const nameEl=document.getElementById('obIncName');
  const amtEl=document.getElementById('obIncAmt');
  const errEl=document.getElementById('obIncomeErr');
  const name=nameEl.value.trim();
  const val=parseFloat(amtEl.value);
  errEl.textContent='';
  if(!name){errEl.textContent='Enter an income source name.';nameEl.focus();return;}
  if(isNaN(val)||val<=0){errEl.textContent='Enter a valid amount greater than 0.';amtEl.focus();return;}
  _obIncome.push({name,amount:Math.round(val*100)/100});
  nameEl.value=''; amtEl.value='';
  obRenderIncome();
  nameEl.focus();
}

function obRemoveIncome(i){
  _obIncome.splice(i,1);
  obRenderIncome();
}

function obRenderIncome(){
  const sym=obGetSym();
  const list=document.getElementById('obIncList');
  if(!list) return;
  if(!_obIncome.length){
    list.innerHTML='<div class="ob-empty-hint">No income sources added yet — use the form above</div>';
    list.classList.add('ob-list-empty');
    return;
  }
  list.classList.remove('ob-list-empty');
  list.innerHTML=_obIncome.map((e,i)=>`
    <div class="ob-item-row">
      <span class="ob-item-name">${e.name.replace(/</g,'&lt;')}</span>
      <span class="ob-item-amt">${sym}${e.amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
      <button class="ob-item-del" onclick="obRemoveIncome(${i})" title="Remove" aria-label="Remove ${e.name.replace(/"/g,'')}">&times;</button>
    </div>`).join('');
}

// ── Expenses ──
function obHandleReceiptFile(input){
  const file=input.files[0];
  if(!file) return;
  if(file.size>204800){showToast('Image too large (max 200KB)','warn-t');input.value='';return;}
  const reader=new FileReader();
  reader.onload=e=>{
    _obReceiptData=e.target.result;
    document.getElementById('obExpReceiptLabel').textContent='✓ '+file.name;
  };
  reader.readAsDataURL(file);
}

function obAddExpense(){
  const nameEl=document.getElementById('obExpName');
  const amtEl=document.getElementById('obExpAmt');
  const errEl=document.getElementById('obExpErr');
  const name=nameEl.value.trim();
  const val=parseFloat(amtEl.value);
  errEl.textContent='';
  if(!name){errEl.textContent='Enter an expense name.';nameEl.focus();return;}
  if(isNaN(val)||val<=0){errEl.textContent='Enter a valid amount greater than 0.';amtEl.focus();return;}
  const week=parseInt(document.getElementById('obExpWeek').value)||0;
  const dueRaw=parseInt(document.getElementById('obExpDue').value);
  const dueDay=(dueRaw>=1&&dueRaw<=31)?dueRaw:null;
  const note=document.getElementById('obExpNote').value.trim();
  _obExpenses.push({name,amount:Math.round(val*100)/100,week,dueDay,note,receipt:_obReceiptData});
  nameEl.value=''; amtEl.value=''; document.getElementById('obExpNote').value='';
  document.getElementById('obExpDue').value=''; document.getElementById('obExpWeek').value='0';
  document.getElementById('obExpReceiptLabel').textContent='📷 Tap to attach image';
  document.getElementById('obExpReceipt').value=''; _obReceiptData=null;
  obRenderExpenses();
  nameEl.focus();
}

function obRemoveExpense(i){
  _obExpenses.splice(i,1);
  obRenderExpenses();
}

function obRenderExpenses(){
  const sym=obGetSym();
  const list=document.getElementById('obExpList');
  if(!list) return;
  if(!_obExpenses.length){
    list.innerHTML='<div class="ob-empty-hint">No expenses added yet — use the form above</div>';
    list.classList.add('ob-list-empty');
    return;
  }
  list.classList.remove('ob-list-empty');
  list.innerHTML=_obExpenses.map((e,i)=>`
    <div class="ob-item-row">
      <span class="ob-item-name">${e.name.replace(/</g,'&lt;')}${e.dueDay?` <span style="font-size:9px;color:var(--text-muted);">due ${e.dueDay}</span>`:''}${e.note?` <span style="font-size:9px;color:var(--text-muted);">&#128203;</span>`:''}</span>
      <span class="ob-item-amt" style="font-size:10px;color:var(--text-muted);margin-right:4px;">Wk${e.week+1}</span>
      <span class="ob-item-amt">${sym}${e.amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}${e.receipt?` <span style="font-size:9px;">&#128248;</span>`:''}</span>
      <button class="ob-item-del" onclick="obRemoveExpense(${i})" title="Remove" aria-label="Remove ${e.name.replace(/"/g,'')}">&times;</button>
    </div>`).join('');
}

// ── Savings ──
function obAddSaving(){
  const nameEl=document.getElementById('obSavName');
  const targetEl=document.getElementById('obSavTarget');
  const balEl=document.getElementById('obSavBal');
  const contribEl=document.getElementById('obSavContrib');
  const rateEl=document.getElementById('obSavRate');
  const errEl=document.getElementById('obSavErr');
  const name=nameEl.value.trim();
  const target=parseFloat(targetEl.value);
  errEl.textContent='';
  if(!name){errEl.textContent='Enter a goal name.';nameEl.focus();return;}
  if(isNaN(target)||target<=0){errEl.textContent='Enter a target amount greater than 0.';targetEl.focus();return;}
  const bal=parseFloat(balEl.value)||0;
  const contrib=parseFloat(contribEl.value)||0;
  const rate=parseFloat(rateEl.value)||0;
  _obSavings.push({name,target:Math.round(target*100)/100,balance:Math.round(bal*100)/100,contribution:Math.round(contrib*100)/100,rate:Math.round(rate*100)/100});
  nameEl.value=''; targetEl.value=''; balEl.value=''; contribEl.value=''; rateEl.value='';
  obRenderSavings();
  nameEl.focus();
}

function obRemoveSaving(i){
  _obSavings.splice(i,1);
  obRenderSavings();
}

function obRenderSavings(){
  const sym=obGetSym();
  const list=document.getElementById('obSavList');
  if(!list) return;
  if(!_obSavings.length){
    list.innerHTML='<div class="ob-empty-hint">No goals added yet — use the form above</div>';
    list.classList.add('ob-list-empty');
    return;
  }
  list.classList.remove('ob-list-empty');
  list.innerHTML=_obSavings.map((g,i)=>`
    <div class="ob-item-row">
      <span class="ob-item-name">${g.name.replace(/</g,'&lt;')}</span>
      <span class="ob-item-amt" style="font-size:10px;color:var(--text-muted);">${sym}${g.balance.toFixed(2)} / ${sym}${g.target.toFixed(2)}</span>
      <button class="ob-item-del" onclick="obRemoveSaving(${i})" title="Remove" aria-label="Remove ${g.name.replace(/"/g,'')}">&times;</button>
    </div>`).join('');
}

// ── Loans ──
function obAddLoan(){
  const nameEl=document.getElementById('obLoanName');
  const balEl=document.getElementById('obLoanBal');
  const rateEl=document.getElementById('obLoanRate');
  const minEl=document.getElementById('obLoanMin');
  const errEl=document.getElementById('obLoanErr');
  const name=nameEl.value.trim();
  const bal=parseFloat(balEl.value);
  const rate=parseFloat(rateEl.value);
  const min=parseFloat(minEl.value);
  errEl.textContent='';
  if(!name){errEl.textContent='Enter a loan name.';nameEl.focus();return;}
  if(isNaN(bal)||bal<=0){errEl.textContent='Enter a valid balance.';balEl.focus();return;}
  if(isNaN(rate)||rate<0){errEl.textContent='Enter a valid interest rate (0 or higher).';rateEl.focus();return;}
  if(isNaN(min)||min<=0){errEl.textContent='Enter a valid minimum payment.';minEl.focus();return;}
  _obLoans.push({
    name,
    amount:Math.round(bal*100)/100,
    originalAmount:Math.round(bal*100)/100,
    rate:Math.round(rate*100)/100,
    minPayment:Math.round(min*100)/100,
    payments:[]
  });
  nameEl.value=''; balEl.value=''; rateEl.value=''; minEl.value='';
  obRenderLoans();
  nameEl.focus();
}

function obRemoveLoan(i){
  _obLoans.splice(i,1);
  obRenderLoans();
}

function obRenderLoans(){
  const sym=obGetSym();
  const list=document.getElementById('obLoanList');
  if(!list) return;
  if(!_obLoans.length){
    list.innerHTML='<div class="ob-empty-hint">No loans added yet — use the form above</div>';
    list.classList.add('ob-list-empty');
    return;
  }
  list.classList.remove('ob-list-empty');
  list.innerHTML=_obLoans.map((l,i)=>`
    <div class="ob-item-row">
      <span class="ob-item-name">${l.name.replace(/</g,'&lt;')}</span>
      <span class="ob-item-amt">${sym}${l.amount.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0})} &bull; ${l.rate}% &bull; min ${sym}${l.minPayment}</span>
      <button class="ob-item-del" onclick="obRemoveLoan(${i})" title="Remove" aria-label="Remove ${l.name.replace(/"/g,'')}">&times;</button>
    </div>`).join('');
}

// ── PIN ──
function obPinKey(key){
  const err=document.getElementById('obPinErr');
  err.textContent='';
  if(key==='del'){_obPin=_obPin.slice(0,-1);obUpdatePinDots();return;}
  if(_obPin.length>=4) return;
  _obPin+=key;
  obUpdatePinDots();
  if(_obPin.length===4){
    if(_obPinPhase==='enter'){
      _obPinFirst=_obPin; _obPin=''; _obPinPhase='confirm';
      document.getElementById('obPinPhaseLabel').textContent='Confirm your PIN';
      obUpdatePinDots();
    } else {
      if(_obPin===_obPinFirst){
        hashPin(_obPin).then(hash=>{
          if(location.protocol==='file:'){
            localStorage.setItem(PIN_IDB_KEY,hash); obGoTo(7);
          } else {
            openIDB().then(db=>{
              const tx=db.transaction(IDB_PIN_STORE,'readwrite');
              tx.objectStore(IDB_PIN_STORE).put(hash,PIN_IDB_KEY);
              tx.oncomplete=()=>obGoTo(7);
              tx.onerror=()=>{localStorage.setItem(PIN_IDB_KEY,hash);obGoTo(7);};
            }).catch(()=>{localStorage.setItem(PIN_IDB_KEY,hash);obGoTo(7);});
          }
        });
      } else {
        err.textContent="PINs don't match — try again";
        _obPin=''; _obPinFirst=''; _obPinPhase='enter';
        document.getElementById('obPinPhaseLabel').textContent='Enter a new PIN';
        obUpdatePinDots();
      }
    }
  }
}

function obUpdatePinDots(){
  for(let i=0;i<4;i++){
    const d=document.getElementById('opd'+i);
    if(d) d.classList.toggle('filled',i<_obPin.length);
  }
}

// ── Finish ──
function obFinish(){
  // Name
  const name=(document.getElementById('obName').value||'').trim();
  if(name) S.userName=name;

  // Currency
  const code=document.getElementById('obCurrency').value;
  if(CURRENCY_MAP[code]) S.currency={symbol:CURRENCY_MAP[code].symbol,code,locale:CURRENCY_MAP[code].locale};

  // Always replace income — use user entries or empty list (clears demo)
  const md=S.months[CMK];
  if(md){
    md.revenue=_obIncome.map(e=>({name:e.name,amount:e.amount,received:true}));
  }

  // Always replace expenses — use user entries or empty (clears demo)
  if(md){
    md.weeks.forEach(w=>{w.items=[];});
    _obExpenses.forEach(e=>{
      const wk=Math.min(3,Math.max(0,e.week||0));
      md.weeks[wk].items.push({name:e.name,amount:e.amount,paid:false,dueDay:e.dueDay||null,note:e.note||'',receipt:e.receipt||null});
    });
  }

  // Always replace loans — use user entries or empty (clears demo)
  S.loans=_obLoans.map(l=>Object.assign({},l));

  // Always replace savings — use user entries or empty (clears demo)
  S.savings=_obSavings.map(g=>Object.assign({},g));

  persist();
  localStorage.setItem('finflow_onboarded','1');
  document.getElementById('demoBanner').style.display='none';

  // Update loan badge
  document.getElementById('loanBadge').textContent=S.loans.length;

  // Update PIN lock button
  getPinHash().then(h=>{const btn=document.getElementById('pinBtn');if(btn) btn.textContent=h?'🔓':'🔒';});

  document.getElementById('onboardOverlay').style.display='none';
  document.body.style.overflow='';

  renderDash();
  updateHealth();
  const greeting=name?'Welcome, '+name+'!':'Welcome to FinFlow!';
  const extras=[];
  if(_obIncome.length) extras.push(_obIncome.length+' income source'+(_obIncome.length>1?'s':''));
  if(_obExpenses.length) extras.push(_obExpenses.length+' expense'+(_obExpenses.length>1?'s':''));
  if(_obLoans.length) extras.push(_obLoans.length+' loan'+(_obLoans.length>1?'s':''));
  if(_obSavings.length) extras.push(_obSavings.length+' savings goal'+(_obSavings.length>1?'s':''));
  const detail=extras.length?' ('+extras.join(', ')+' added)':'';
  showToast(greeting+' Dashboard ready'+detail+'.');
}
