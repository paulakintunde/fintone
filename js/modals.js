// === modals.js ===

// ── FOCUS TRAP FOR MODALS ──
function trapFocus(modal){
  const focusable=modal.querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])');
  const first=focusable[0], last=focusable[focusable.length-1];
  function handler(e){
    if(e.key!=='Tab')return;
    if(e.shiftKey){ if(document.activeElement===first){e.preventDefault();last.focus();} }
    else{ if(document.activeElement===last){e.preventDefault();first.focus();} }
  }
  modal._trapHandler=handler;
  modal.addEventListener('keydown',handler);
}
function releaseTrap(modal){
  if(modal&&modal._trapHandler)modal.removeEventListener('keydown',modal._trapHandler);
}

// ══════════════════════════════════════════════════════════════
// EXPENSE ITEM MODAL — Add & Edit
// ══════════════════════════════════════════════════════════════
let _iModalWi=-1, _iModalIi=-1, _iModalReceipt=null, _iModalCat='cat-other', _iModalStatus='pending';

function openItemModal(wi, ii){
  _iModalWi=wi; _iModalIi=ii;
  const isEdit = ii >= 0;
  const item = isEdit ? cw()[wi].items[ii] : null;

  // Header
  document.getElementById('itemModalTitle').textContent = isEdit ? 'Edit Expense' : 'Add Expense';
  document.getElementById('itemModalWeekLabel').textContent = 'Week '+(wi+1)+' · '+CMK;
  document.getElementById('iDeleteBtn').style.display = isEdit ? 'block' : 'none';

  // Pre-fill fields
  document.getElementById('iName').value = isEdit ? item.name : '';
  document.getElementById('iAmount').value = isEdit ? item.amount : '';
  document.getElementById('iNote').value = isEdit ? (item.note||'') : '';
  document.getElementById('iDueDay').value = isEdit && item.dueDay ? item.dueDay : '';

  // Category — auto-detect from name if new, use stored if editing
  _iModalCat = isEdit ? getCat(item.name) : 'cat-other';
  renderCatPills(_iModalCat);

  // Status
  _iModalStatus = isEdit ? (item.paid ? 'paid' : 'pending') : 'pending';
  setItemStatus(_iModalStatus);

  // Due day quick-pick grid
  renderDueDayGrid(isEdit && item.dueDay ? item.dueDay : 0);

  // Receipt
  _iModalReceipt = isEdit ? (item.receipt||null) : null;
  renderItemReceiptPreview();

  // Frequency
  const freqEl=document.getElementById('iFrequency');
  if(freqEl) freqEl.value = isEdit ? (item.frequency||'monthly') : 'monthly';
  const ymEl=document.getElementById('iYearlyMonth');
  if(ymEl) ymEl.value = isEdit ? (item._scheduledYearMonth||0) : 0;
  itemFreqChange();

  // Reset custom categories — add them to pills
  renderCatPills(_iModalCat);

  const _im=document.getElementById('itemModal');
  _im.classList.add('open');
  trapFocus(_im);

  // Focus name if adding, amount if editing (name already known)
  setTimeout(()=>{
    if(!isEdit) document.getElementById('iName').focus();
    else document.getElementById('iAmount').focus();
  },120);
}

function closeItemModal(){
  const _im=document.getElementById('itemModal');
  _im.classList.remove('open');
  releaseTrap(_im);
  _iModalWi=-1; _iModalIi=-1; _iModalReceipt=null;
}

function renderCatPills(selectedCls){
  _iModalCat = selectedCls;
  // Get all cats — built-in + custom
  const allCats = [...CAT_ALL];
  if(S.customCategories&&S.customCategories.length){
    S.customCategories.forEach(cc=>{
      allCats.push({cls:'cat-custom-'+cc.id, lbl:cc.name, icon:'🏷', custom:true, bg:cc.bg, color:cc.color});
    });
  }
  document.getElementById('catPillGrid').innerHTML = allCats.map(cat=>{
    const isSel = cat.cls===selectedCls;
    const style = cat.custom ? 'background:'+cat.bg+';color:'+cat.color+';' : '';
    return`<button class="cat-pill-opt ${cat.cls}${isSel?' selected':''}" style="${style}" data-action="selectCat" data-arg="${cat.cls}">${cat.icon} ${cat.lbl}</button>`;
  }).join('');
}

function selectCat(cls){
  renderCatPills(cls);
}

function setItemStatus(s){
  _iModalStatus=s;
  document.getElementById('iStatusPending').classList.toggle('sel', s==='pending');
  document.getElementById('iStatusPaid').classList.toggle('sel', s==='paid');
}

function renderDueDayGrid(selectedDay){
  const days=[];
  for(let d=1;d<=31;d++) days.push(d);
  document.getElementById('dueDayGrid').innerHTML = days.map(d=>
    `<button class="due-day-btn${d===selectedDay?' sel':''}" data-action="pickDueDay" data-arg="${d}">${d}</button>`
  ).join('');
}

function pickDueDay(d){
  document.getElementById('iDueDay').value = d;
  renderDueDayGrid(d);
  // Auto-show which week this day falls in (monthly only)
  const freqEl=document.getElementById('iFrequency');
  const freq=freqEl?freqEl.value:'monthly';
  const hint=document.getElementById('iFreqHint');
  if(hint&&freq==='monthly'){
    const wk=getWeekForDay(d,CMK);
    hint.textContent='Day '+d+' falls in Week '+(wk+1)+' of '+CMK;
  }
}

// Show/hide yearly-month row and update frequency hint text
function itemFreqChange(){
  const freqEl=document.getElementById('iFrequency');
  const freq=freqEl?freqEl.value:'monthly';
  const yearlyRow=document.getElementById('iYearlyMonthRow');
  const hint=document.getElementById('iFreqHint');
  if(yearlyRow)yearlyRow.style.display=freq==='yearly'?'block':'none';
  if(hint){
    const msgs={
      monthly:'',
      weekly:'4 line items will be created — one per week.',
      biweekly:'2 line items created for Week 1 and Week 3.',
      quarterly:'Auto-added to January, April, July, and October.',
      yearly:'Auto-added once per year in the selected month.'
    };
    hint.textContent=msgs[freq]||'';
  }
}

function clearItemDueDay(){
  document.getElementById('iDueDay').value='';
  renderDueDayGrid(0);
}

function itemNameAutoTag(name){
  // Auto-detect category from name as user types
  const detected = getCat(name);
  if(detected !== _iModalCat){
    renderCatPills(detected);
  }
}

function renderItemReceiptPreview(){
  const zone = document.getElementById('iReceiptZone');
  const prev = document.getElementById('iReceiptPreview');
  if(_iModalReceipt){
    const wrap=document.createElement('div');wrap.style.cssText='position:relative;display:inline-block;margin-bottom:6px;';
    const img=document.createElement('img');img.src=_iModalReceipt;img.className='receipt-modal-preview';
    img.addEventListener('click',function(){this.style.maxHeight=this.style.maxHeight==='none'?'150px':'none';});
    const rmBtn=document.createElement('button');rmBtn.textContent='✕';rmBtn.title='Remove receipt';rmBtn.setAttribute('aria-label','Remove receipt');
    rmBtn.style.cssText='position:absolute;top:4px;right:4px;background:rgba(0,0,0,.5);color:white;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;';
    rmBtn.addEventListener('click',removeItemReceipt);
    wrap.appendChild(img);wrap.appendChild(rmBtn);
    prev.innerHTML='';prev.appendChild(wrap);
    zone.style.display='none';
  } else {
    prev.innerHTML='';
    zone.style.display='block';
  }
}

function handleItemReceipt(file){
  if(!file) return;
  if(file.size>204800){ showToast('Image too large (max 200KB)','warn-t'); return; }
  const reader=new FileReader();
  reader.onload=e=>{ _iModalReceipt=e.target.result; renderItemReceiptPreview(); };
  reader.readAsDataURL(file);
}

function removeItemReceipt(){
  _iModalReceipt=null;
  document.getElementById('iReceiptInput').value='';
  renderItemReceiptPreview();
}

function saveItemModal(){
  const name = document.getElementById('iName').value.trim();
  const amountRaw = parseFloat(document.getElementById('iAmount').value)||0;
  const amount = storeCents(amountRaw);
  const note = document.getElementById('iNote').value.trim();
  const dueDayRaw = parseInt(document.getElementById('iDueDay').value);
  const dueDay = (!isNaN(dueDayRaw)&&dueDayRaw>=1&&dueDayRaw<=31) ? dueDayRaw : null;
  const freq = (document.getElementById('iFrequency')||{}).value || 'monthly';
  const yearlyMonth = parseInt((document.getElementById('iYearlyMonth')||{}).value)||0;

  if(!name){ showToast('Please enter an item name','warn-t'); document.getElementById('iName').focus(); return; }

  // ── QUARTERLY / YEARLY → scheduled template ──
  if(freq==='quarterly'||freq==='yearly'){
    if(!S.scheduledExpenses)S.scheduledExpenses=[];
    const isEditingSched = _iModalIi>=0 && cw()[_iModalWi]&&cw()[_iModalWi].items[_iModalIi]&&cw()[_iModalWi].items[_iModalIi]._scheduledId;
    const existingId = isEditingSched ? cw()[_iModalWi].items[_iModalIi]._scheduledId : ('se'+Date.now());
    const se={id:existingId,name,amount,frequency:freq,dueDay,note,week:_iModalWi,yearMonth:yearlyMonth};
    if(isEditingSched){
      const idx=S.scheduledExpenses.findIndex(s=>s.id===existingId);
      if(idx>=0)S.scheduledExpenses[idx]=se; else S.scheduledExpenses.push(se);
      cw()[_iModalWi].items[_iModalIi]=Object.assign({},cw()[_iModalWi].items[_iModalIi],{name,amount,dueDay,note,frequency:freq,_scheduledId:existingId,_scheduledYearMonth:yearlyMonth});
    } else {
      S.scheduledExpenses.push(se);
      expandScheduledExpenses(CMK); // inject into current month if it qualifies
    }
    try{persist();}catch(e){showToast('✗ Could not save','err-t');return;}
    closeItemModal(); renderExpenses(); updateHealth();
    const lbl=freq.charAt(0).toUpperCase()+freq.slice(1);
    showToast('✓ '+lbl+' expense saved — auto-appears in qualifying months');
    return;
  }

  // ── WEEKLY → 4 items, one per week ──
  if(freq==='weekly'){
    if(_iModalIi>=0){
      // Edit: update just this occurrence
      cw()[_iModalWi].items[_iModalIi]=Object.assign({},cw()[_iModalWi].items[_iModalIi],{name,amount,dueDay,note,frequency:'weekly'});
    } else {
      cw().forEach(w=>{
        w.items.push({name,amount,paid:false,dueDay,note,receipt:null,frequency:'weekly',currency:getCurrency().code,_savingsItem:false});
      });
    }
    try{persist();}catch(e){showToast('✗ Could not save','err-t');return;}
    closeItemModal(); renderExpenses(); updateHealth();
    showToast(_iModalIi>=0?'✓ Item updated':'✓ Weekly expense added to all 4 weeks');
    return;
  }

  // ── BI-WEEKLY → Week 1 (idx 0) and Week 3 (idx 2) ──
  if(freq==='biweekly'){
    if(_iModalIi>=0){
      cw()[_iModalWi].items[_iModalIi]=Object.assign({},cw()[_iModalWi].items[_iModalIi],{name,amount,dueDay,note,frequency:'biweekly'});
    } else {
      [0,2].forEach(wi=>{
        if(cw()[wi])cw()[wi].items.push({name,amount,paid:false,dueDay,note,receipt:null,frequency:'biweekly',currency:getCurrency().code,_savingsItem:false});
      });
    }
    try{persist();}catch(e){showToast('✗ Could not save','err-t');return;}
    closeItemModal(); renderExpenses(); updateHealth();
    showToast(_iModalIi>=0?'✓ Item updated':'✓ Bi-weekly expense added to Week 1 & Week 3');
    return;
  }

  // ── MONTHLY (default) — standard single item ──
  const newItem = {
    name, amount,
    paid: _iModalStatus==='paid',
    dueDay, note,
    receipt: _iModalReceipt,
    currency: getCurrency().code,
    frequency: 'monthly',
    _savingsItem: false
  };

  if(_iModalIi>=0){
    const existing = cw()[_iModalWi].items[_iModalIi];
    newItem._savingsItem = existing._savingsItem||false;
    cw()[_iModalWi].items[_iModalIi] = newItem;
  } else {
    cw()[_iModalWi].items.push(newItem);
  }

  const wasNew=_iModalIi<0;
  const isPaid=newItem.paid;
  try{persist();}catch(e){showToast('✗ Could not save item','err-t');return;}
  closeItemModal();
  renderExpenses();
  updateHealth();
  if(isPaid){launchConfetti(wasNew?30:18);}
  showToast(_iModalIi>=0?'✓ Item updated':'✓ Item added');
}

// Override deleteItemFromModal to show inline confirm
function deleteItemFromModal() {
  const qc = document.getElementById('iDeleteConfirm');
  if (qc) qc.classList.add('show');
}
function hideItemDeleteConfirm() {
  const qc = document.getElementById('iDeleteConfirm');
  if (qc) qc.classList.remove('show');
}
function confirmDeleteItem() {
  if (_iModalWi < 0 || _iModalIi < 0) return;
  cw()[_iModalWi].items.splice(_iModalIi, 1);
  persist(); closeItemModal(); renderExpenses(); updateHealth();
  showToast('✓ Item deleted');
}

// ══════════════════════════════════════════════════════════════
// LOAN MODAL
// ══════════════════════════════════════════════════════════════
let _loanEditIdx = -1;

function openLoanModal(idx) {
  _loanEditIdx = idx;
  const isEdit = idx >= 0;
  const loan = isEdit ? S.loans[idx] : null;

  document.getElementById('loanModalTitle').textContent = isEdit ? 'Edit Loan' : 'Add Loan';
  document.getElementById('lName').value = isEdit ? loan.name : '';
  document.getElementById('lBalance').value = isEdit ? amt(loan.amount) : '';
  document.getElementById('lOriginal').value = isEdit ? amt(loan.originalAmount || loan.amount) : '';
  document.getElementById('lRate').value = isEdit ? loan.rate : '';
  document.getElementById('lMinPmt').value = isEdit ? amt(loan.minPayment) : '';

  document.getElementById('lDeleteBtn').style.display = isEdit ? 'block' : 'none';
  document.getElementById('loanDeleteConfirm').classList.remove('show');

  const _lm=document.getElementById('loanModal');
  _lm.classList.add('open');
  trapFocus(_lm);
  setTimeout(()=>document.getElementById('lName').focus(),120);
}

function closeLoanModal() {
  const _lm=document.getElementById('loanModal');
  _lm.classList.remove('open');
  releaseTrap(_lm);
}

function showLoanDeleteConfirm() {
  document.getElementById('loanDeleteConfirm').classList.add('show');
}
function hideLoanDeleteConfirm() {
  document.getElementById('loanDeleteConfirm').classList.remove('show');
}

function confirmDeleteLoan() {
  if (_loanEditIdx < 0) return;
  S.loans.splice(_loanEditIdx, 1);
  persist(); closeLoanModal(); renderLoans(); updateHealth();
  showToast('✓ Loan deleted');
}

function saveLoanModal() {
  const name = document.getElementById('lName').value.trim();
  const balanceRaw = parseFloat(document.getElementById('lBalance').value)||0;
  const balance = storeCents(balanceRaw);
  const origRaw = parseFloat(document.getElementById('lOriginal').value)||0;
  const original = storeCents(origRaw);
  const rate = parseFloat(document.getElementById('lRate').value);
  const minPmt = parseFloat(document.getElementById('lMinPmt').value);

  if (!name) { showToast('Enter a loan name', 'warn-t'); document.getElementById('lName').focus(); return; }
  if (isNaN(balance) || balance < 0) { showToast('Enter a valid current balance', 'warn-t'); document.getElementById('lBalance').focus(); return; }
  if (isNaN(rate) || rate < 0) { showToast('Enter a valid interest rate', 'warn-t'); document.getElementById('lRate').focus(); return; }
  if (isNaN(minPmt) || minPmt < 0) { showToast('Enter a valid minimum payment', 'warn-t'); document.getElementById('lMinPmt').focus(); return; }

  const origAmt = (!isNaN(original) && original > 0) ? original : balance;

  if (_loanEditIdx >= 0) {
    // Edit — preserve payment history
    const existing = S.loans[_loanEditIdx];
    existing.name = name;
    existing.amount = Math.round(balance * 100) / 100;
    existing.originalAmount = Math.round(origAmt * 100) / 100;
    existing.rate = rate;
    existing.minPayment = minPmt;
  } else {
    // Add new
    S.loans.push({
      name, amount: Math.round(balance * 100) / 100,
      originalAmount: Math.round(origAmt * 100) / 100,
      rate, minPayment: minPmt,
      payments: [{ month: CMK, paid: false }]
    });
  }

  const loanJustPaid=(_loanEditIdx>=0&&balance===0&&((S.loans[_loanEditIdx]&&S.loans[_loanEditIdx].originalAmount)||0)>0);
  try{persist();}catch(e){showToast('✗ Could not save loan','err-t');return;}
  closeLoanModal(); renderLoans(); updateHealth();
  if(loanJustPaid){celebrateLoanPaidOff(name);checkAllLoansDebtFree();}
  else showToast(_loanEditIdx>=0?'✓ Loan updated':'✓ Loan added');
}

// ══════════════════════════════════════════════════════════════
// REVENUE MODAL
// ══════════════════════════════════════════════════════════════
let _revEditIdx = -1, _revStatus = 'pending';

function openRevModal(idx) {
  _revEditIdx = idx;
  const isEdit = idx >= 0;
  const item = isEdit ? cr()[idx] : null;

  document.getElementById('revModalTitle').textContent = isEdit ? 'Edit Income Source' : 'Add Income Source';
  document.getElementById('rName').value = isEdit ? item.name : '';
  document.getElementById('rAmount').value = isEdit ? item.amount : '';
  document.getElementById('rNote').value = isEdit ? (item.note || '') : '';

  _revStatus = isEdit ? (item.received ? 'received' : 'pending') : 'pending';
  setRevStatus(_revStatus);

  document.getElementById('rDeleteBtn').style.display = isEdit ? 'block' : 'none';
  document.getElementById('revDeleteConfirm').classList.remove('show');

  const _rm=document.getElementById('revModal');
  _rm.classList.add('open');
  trapFocus(_rm);
  setTimeout(()=>document.getElementById('rName').focus(),120);
}

function closeRevModal() {
  const _rm=document.getElementById('revModal');
  _rm.classList.remove('open');
  releaseTrap(_rm);
}

function setRevStatus(s) {
  _revStatus = s;
  document.getElementById('rStatusPending').classList.toggle('sel', s === 'pending');
  document.getElementById('rStatusReceived').classList.toggle('sel', s === 'received');
}

function showRevDeleteConfirm() {
  document.getElementById('revDeleteConfirm').classList.add('show');
}
function hideRevDeleteConfirm() {
  document.getElementById('revDeleteConfirm').classList.remove('show');
}

function confirmDeleteRev() {
  if (_revEditIdx < 0) return;
  cr().splice(_revEditIdx, 1);
  persist(); closeRevModal(); renderRevenue(); updateHealth();
  showToast('✓ Income source deleted');
}

function saveRevModal() {
  const name = document.getElementById('rName').value.trim();
  const amountRaw2 = parseFloat(document.getElementById('rAmount').value)||0;
  const amount = storeCents(amountRaw2);
  const note = document.getElementById('rNote').value.trim();

  if (!name) { showToast('Enter a source name', 'warn-t'); document.getElementById('rName').focus(); return; }

  if (_revEditIdx >= 0) {
    cr()[_revEditIdx] = { name, amount, received: _revStatus === 'received', note };
  } else {
    cr().push({ name, amount, received: _revStatus === 'received', note });
  }

  try{persist();}catch(e){showToast("✗ Could not save income","err-t");} closeRevModal(); renderRevenue(); updateHealth();
  showToast(_revEditIdx >= 0 ? '✓ Income updated' : '✓ Income added');
}

// ══════════════════════════════════════════════
// NOTES & RECEIPTS
// ══════════════════════════════════════════════
function openNoteModal(wi,ii){ openItemModal(wi,ii); return; // redirected to item modal
  if(false){
  _noteWi=wi;_noteIi=ii;
  const item=cw()[wi].items[ii];
  document.getElementById('noteModalItemName').textContent=item.name;
  document.getElementById('noteModalInput').value=item.note||'';
  document.getElementById('noteModal').classList.add('open');
  trapFocus(document.getElementById('noteModal'));
  setTimeout(()=>{const _f=document.querySelector('#noteModal textarea');if(_f)_f.focus();},120);
  setTimeout(()=>document.getElementById('noteModalInput').focus(),100);
  } // end if(false)
}
function closeNoteModal(){releaseTrap(document.getElementById('noteModal'));
  document.getElementById('noteModal').classList.remove('open');}
function saveNote(){
  cw()[_noteWi].items[_noteIi].note=document.getElementById('noteModalInput').value.trim();
  persist();closeNoteModal();renderExpenses();
}
function clearNote(){
  cw()[_noteWi].items[_noteIi].note='';
  persist();closeNoteModal();renderExpenses();
}

function openReceiptModal(wi,ii){
  _receiptWi=wi;_receiptIi=ii;
  const item=cw()[wi].items[ii];
  document.getElementById('receiptModalItemName').textContent=item.name;
  document.getElementById('receiptFileInput').value='';
  const wrap=document.getElementById('receiptImgWrap');
  wrap.innerHTML='';
  if(item.receipt){
    const thumb=document.createElement('img');thumb.src=item.receipt;thumb.className='receipt-thumb';
    thumb.addEventListener('click',function(){this.style.maxHeight=this.style.maxHeight==='none'?'120px':'none';});
    wrap.appendChild(thumb);
  } else {
    wrap.innerHTML='<p style="color:var(--text-muted);font-size:12px;padding:16px 0;">No receipt attached yet.</p>';
  }
  document.getElementById('receiptModal').classList.add('open');
  trapFocus(document.getElementById('receiptModal'));
  setTimeout(()=>{const _f=document.querySelector('#receiptModal button');if(_f)_f.focus();},120);
}
function closeReceiptModal(){releaseTrap(document.getElementById('receiptModal'));
  document.getElementById('receiptModal').classList.remove('open');}
function handleReceiptFile(file){
  if(!file)return;
  if(file.size>204800){showToast('Image too large (max 200KB)','warn-t');return;}
  const reader=new FileReader();
  reader.onload=e=>{
    cw()[_receiptWi].items[_receiptIi].receipt=e.target.result;
    persist();closeReceiptModal();renderExpenses();showToast('✓ Receipt attached');
  };
  reader.readAsDataURL(file);
}
function clearReceipt(){
  cw()[_receiptWi].items[_receiptIi].receipt=null;
  persist();closeReceiptModal();renderExpenses();showToast('✓ Receipt removed');
}

function openImport(){const _im2=document.getElementById('importModal');_im2.classList.add('open');trapFocus(_im2);}
function closeImport(){const _im2=document.getElementById('importModal');releaseTrap(_im2);_im2.classList.remove('open');}
function doImport(){
  try{
    const p=JSON.parse(document.getElementById('importJson').value);
    if(!p.months)throw new Error();
    S=p;CMK=S.currentMonthKey||Object.keys(S.months)[0];
    if(!S.savings)S.savings=[];if(!S.budgets)S.budgets={...BDFT};
    persist();closeImport();applyDark();updateMonthLabel();renderSection(getTab());updateHealth();
    showToast('✓ Import successful');
  }catch(e){showToast('Invalid JSON backup','err-t');}
}

// ══════════════════════════════════════════════
// MONTH COMPARISON
// ══════════════════════════════════════════════
function openCompareModal(){
  const keys=[...Object.keys(S.months),...Object.keys(S.archivedMonths||{})];
  const opts=keys.map(k=>'<option value="'+k+'">'+k+'</option>').join('');
  document.getElementById('compareA').innerHTML=opts;
  document.getElementById('compareB').innerHTML=opts;
  // Default to last two months
  if(keys.length>=2){document.getElementById('compareA').value=keys[keys.length-2];document.getElementById('compareB').value=keys[keys.length-1];}
  renderComparison();
  document.getElementById('compareModal').classList.add('open');
  trapFocus(document.getElementById('compareModal'));
  setTimeout(()=>{const _f=document.querySelector('#compareModal select');if(_f)_f.focus();},120);
}
function closeCompareModal(){releaseTrap(document.getElementById('compareModal'));
  document.getElementById('compareModal').classList.remove('open');}

function getMonthData(key){return S.months[key]||(S.archivedMonths&&S.archivedMonths[key])||null;}

function renderComparison(){
  const kA=document.getElementById('compareA').value;
  const kB=document.getElementById('compareB').value;
  const mA=getMonthData(kA);const mB=getMonthData(kB);
  if(!mA||!mB){document.getElementById('compareResult').innerHTML='<p style="color:var(--text-muted);">Select two months to compare.</p>';return;}
  const revA=mA.revenue.reduce((s,r)=>s+r.amount,0);const revB=mB.revenue.reduce((s,r)=>s+r.amount,0);
  const expA=mA.weeks.reduce((s,w)=>s+w.items.reduce((a,i)=>a+i.amount,0),0);
  const expB=mB.weeks.reduce((s,w)=>s+w.items.reduce((a,i)=>a+i.amount,0),0);
  const netA=revA-expA;const netB=revB-expB;
  // Category breakdown
  const catsA={},catsB={};
  mA.weeks.forEach(w=>w.items.forEach(i=>{const c=getCatLabel(getCat(i.name));catsA[c]=(catsA[c]||0)+i.amount;}));
  mB.weeks.forEach(w=>w.items.forEach(i=>{const c=getCatLabel(getCat(i.name));catsB[c]=(catsB[c]||0)+i.amount;}));
  const allCats=[...new Set([...Object.keys(catsA),...Object.keys(catsB)])].sort();
  function diff(a,b){const d=b-a;return(d>=0?'+':'')+fmt(d);}
  function col(d){return d>=0?'var(--success)':'var(--danger)';}
  const catRows=allCats.map(c=>{
    const a=catsA[c]||0,b=catsB[c]||0;
    return`<tr><td>${c}</td><td class="acol">${fmt(a)}</td><td class="acol">${fmt(b)}</td><td class="acol" style="color:${col(b-a)};">${diff(a,b)}</td></tr>`;
  }).join('');
  document.getElementById('compareResult').innerHTML=`
    <table style="margin-bottom:12px;">
      <thead><tr><th>Metric</th><th class="acol">${kA}</th><th class="acol">${kB}</th><th class="acol">Change</th></tr></thead>
      <tbody>
        <tr><td style="font-weight:600;">Income</td><td class="acol">${fmt(revA)}</td><td class="acol">${fmt(revB)}</td><td class="acol" style="color:${col(revB-revA)};">${diff(revA,revB)}</td></tr>
        <tr><td style="font-weight:600;">Expenses</td><td class="acol">${fmt(expA)}</td><td class="acol">${fmt(expB)}</td><td class="acol" style="color:${col(expA-expB)};">${diff(expA,expB)}</td></tr>
        <tr style="background:var(--sage-light);"><td style="font-weight:700;">Net Flow</td><td class="acol" style="font-weight:700;">${fmt(netA)}</td><td class="acol" style="font-weight:700;">${fmt(netB)}</td><td class="acol" style="font-weight:700;color:${col(netB-netA)};">${diff(netA,netB)}</td></tr>
      </tbody>
    </table>
    <div style="font-weight:600;font-size:12px;margin-bottom:6px;">Category Breakdown</div>
    <table><thead><tr><th>Category</th><th class="acol">${kA}</th><th class="acol">${kB}</th><th class="acol">Change</th></tr></thead><tbody>${catRows}</tbody></table>
  `;
}

// ══════════════════════════════════════════════
// CUSTOM CATEGORY MANAGER
// ══════════════════════════════════════════════
function openCatManager(){
  renderCatManagerList();
  document.getElementById('catManagerModal').classList.add('open');
  trapFocus(document.getElementById('catManagerModal'));
  setTimeout(()=>{const _f=document.querySelector('#catManagerModal input');if(_f)_f.focus();},120);
}
function closeCatManager(){releaseTrap(document.getElementById('catManagerModal'));
  document.getElementById('catManagerModal').classList.remove('open');}

function renderCatManagerList(){
  const cats=S.customCategories||[];
  const el=document.getElementById('customCatList');
  if(!cats.length){el.innerHTML='<p style="font-size:12px;color:var(--text-muted);">No custom categories yet. Add one below.</p>';return;}
  el.innerHTML=cats.map((c,i)=>`
    <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);">
      <span class="cat-badge" style="background:${c.bg};color:${c.color};">${c.name}</span>
      <span style="font-size:11px;color:var(--text-muted);flex:1;">Keywords: ${c.keywords.join(', ')}</span>
      <button class="tbtn" style="font-size:10px;padding:2px 7px;color:var(--danger);" data-action="delCustomCat" data-arg="${i}">Remove</button>
    </div>`).join('');
}

function updateCatPreview(){
  const bg=document.getElementById('newCatBg').value;
  const color=document.getElementById('newCatColor').value;
  const name=document.getElementById('newCatName').value.trim()||'Category';
  const p=document.getElementById('catColorPreview');
  if(p){p.style.background=bg;p.style.color=color;p.textContent=name;}
}
function addCustomCategory(){
  const name=document.getElementById('newCatName').value.trim();
  const kwStr=document.getElementById('newCatKeywords').value;
  const bg=document.getElementById('newCatBg').value;
  const color=document.getElementById('newCatColor').value;
  if(!name){showToast('Enter a category name','warn-t');return;}
  const keywords=kwStr.split(',').map(k=>k.trim()).filter(Boolean);
  if(!keywords.length){showToast('Enter at least one keyword','warn-t');return;}
  if(!S.customCategories)S.customCategories=[];
  const id='cc'+Date.now();
  S.customCategories.push({id,name,keywords,bg,color});
  // Also add to BDFT and S.budgets
  if(!S.budgets[name])S.budgets[name]=500;
  persist();renderCatManagerList();
  document.getElementById('newCatName').value='';
  document.getElementById('newCatKeywords').value='';
  showToast('✓ Category added: '+name);
}

function delCustomCat(i){
  S.customCategories.splice(i,1);
  persist();renderCatManagerList();showToast('Category removed');
}

function openEnvModal(cat){_envCat=cat;document.getElementById('envCatName').textContent='Category: '+cat;document.getElementById('envCapInput').value=S.budgets[cat]||BDFT[cat]||500;document.getElementById('envModal').classList.add('open');
  trapFocus(document.getElementById('envModal'));
  setTimeout(()=>{const _f=document.querySelector('#envModal input');if(_f)_f.focus();},120);
  setTimeout(()=>{ const f=document.querySelector('#envModal input'); if(f)f.focus(); },120);}
function closeEnvModal(){releaseTrap(document.getElementById('envModal'));
  document.getElementById('envModal').classList.remove('open');}
function saveEnvCap(){const v=parseFloat(document.getElementById('envCapInput').value)||0;S.budgets[_envCat]=v;persist();renderEnvelopes();closeEnvModal();}

// ══════════════════════════════════════════════
// CSV IMPORT
// ══════════════════════════════════════════════
function openCsvModal(){
  _csvRows=[];_csvHeaders=[];
  document.getElementById('csvColMap').style.display='none';
  document.getElementById('csvBtnRow').style.display='none';
  document.getElementById('csvPreview').innerHTML='';
  document.getElementById('csvFileInput').value='';
  document.getElementById('csvModal').classList.add('open');
  trapFocus(document.getElementById('csvModal'));
  setTimeout(()=>{const _f=document.querySelector('#csvModal button');if(_f)_f.focus();},120);
  setTimeout(()=>{ const f=document.querySelector('#csvModal input,#csvModal button'); if(f)f.focus(); },120);
  // Drag & drop
  const dz=document.getElementById('csvDropZone');
  dz.ondragover=e=>{e.preventDefault();dz.classList.add('dragging');};
  dz.ondragleave=()=>dz.classList.remove('dragging');
  dz.ondrop=e=>{e.preventDefault();dz.classList.remove('dragging');handleCsvFile(e.dataTransfer.files[0]);};
}
function closeCsvModal(){releaseTrap(document.getElementById('csvModal'));
  document.getElementById('csvModal').classList.remove('open');}

function handleCsvFile(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const raw=e.target.result;const lines=raw.split(/\r?\n/).filter(l=>l.trim());
    if(!lines.length){showToast('Empty file','warn-t');return;}
    _csvHeaders=lines[0].split(',').map(h=>h.replace(/^[\s"]+|[\s"]+$/g,'').trim());
    _csvRows=lines.slice(1).map(line=>{
      const cells=[];let cur='',inQ=false;
      for(const ch of line){if(ch==='"'){inQ=!inQ;}else if(ch===','&&!inQ){cells.push(cur.trim());cur='';}else cur+=ch;}
      cells.push(cur.trim());
      return _csvHeaders.reduce((obj,hdr,i)=>{obj[hdr]=cells[i]||'';return obj;},{});
    }).filter(r=>Object.values(r).some(v=>v));

    // Populate column selects
    const opts='<option value="">-- select --</option>'+_csvHeaders.map(h=>`<option value="${h}">${h}</option>`).join('');
    ['csvColDate','csvColDesc','csvColAmt','csvColType'].forEach(id=>document.getElementById(id).innerHTML=opts+(id==='csvColType'?'<option value="none">None</option>':''));
    // Auto-detect columns by common names
    const autoMap={csvColDate:['date','transaction date','trans date'],csvColDesc:['description','desc','payee','merchant','details'],csvColAmt:['amount','debit','credit','transaction amount'],csvColType:['type','dr/cr','debit/credit']};
    Object.entries(autoMap).forEach(([id,names])=>{const h2=_csvHeaders.find(h=>names.some(n=>h.toLowerCase().includes(n)));if(h2)document.getElementById(id).value=h2;});

    document.getElementById('csvColMap').style.display='block';
    document.getElementById('csvBtnRow').style.display='flex';
    renderCsvPreview();
  };
  reader.readAsText(file);
}

function renderCsvPreview(){
  const dateCol=document.getElementById('csvColDate').value;
  const descCol=document.getElementById('csvColDesc').value;
  const amtCol=document.getElementById('csvColAmt').value;
  const typeCol=document.getElementById('csvColType').value;
  const preview=_csvRows.slice(0,8).map(row=>{
    const amt=parseFloat((row[amtCol]||'').replace(/[$,]/g,''))||0;
    const isDebit=typeCol==='none'?amt<0:(row[typeCol]||'').toLowerCase().includes('debit')||amt<0;
    const skip=!isDebit;
    return`<tr class="${skip?'skipped':''}"><td>${row[dateCol]||'—'}</td><td>${row[descCol]||'—'}</td><td class="acol">${fmt(Math.abs(amt))}</td><td>${skip?'<span style="color:var(--text-muted);font-size:10px;">skip</span>':'<span style="color:var(--success);font-size:10px;">import</span>'}</td></tr>`;
  }).join('');
  const count=countCsvImportable();
  document.getElementById('csvImportCount').textContent=count;
  document.getElementById('csvPreview').innerHTML=`<table><thead><tr><th>Date</th><th>Description</th><th class="acol">Amount</th><th>Action</th></tr></thead><tbody>${preview}</tbody></table>`;
}
function countCsvImportable(){
  const amtCol=document.getElementById('csvColAmt').value;
  const typeCol=document.getElementById('csvColType').value;
  return _csvRows.filter(row=>{
    const amt=parseFloat((row[amtCol]||'').replace(/[$,]/g,''))||0;
    return typeCol==='none'?amt<0:(row[typeCol]||'').toLowerCase().includes('debit')||amt<0;
  }).length;
}

function executeCsvImport(){
  const dateCol=document.getElementById('csvColDate').value;
  const descCol=document.getElementById('csvColDesc').value;
  const amtCol=document.getElementById('csvColAmt').value;
  const typeCol=document.getElementById('csvColType').value;
  const target=document.getElementById('csvImportTarget').value;
  let imported=0;
  _csvRows.forEach(row=>{
    const amt=parseFloat((row[amtCol]||'').replace(/[$,]/g,''))||0;
    const isDebit=typeCol==='none'?amt<0:(row[typeCol]||'').toLowerCase().includes('debit')||amt<0;
    if(!isDebit)return;
    const name=(row[descCol]||'Transaction').substring(0,40);
    const absAmt=Math.abs(amt);
    // Determine week from date (day of month)
    let weekIdx=0;
    const dateStr=row[dateCol]||'';
    const day=parseInt(dateStr.replace(/.*[-\/]/,''))||1;
    weekIdx=day<=7?0:day<=14?1:day<=21?2:3;
    if(target==='expenses'){
      cw()[weekIdx].items.push({name,amount:absAmt,paid:false,dueDay:null,note:`Imported: ${dateStr}`,receipt:null});
    } else {
      cr().push({name,amount:absAmt,received:false});
    }
    imported++;
  });
  persist();closeCsvModal();
  if(target==='expenses')renderExpenses();else renderRevenue();
  showToast(`✓ Imported ${imported} transactions`);
}
