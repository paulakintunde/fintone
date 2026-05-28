// === expenses.js ===

const _collapsedWeeks=new Set();
function toggleWeekCollapse(wi){
  if(_collapsedWeeks.has(wi))_collapsedWeeks.delete(wi);
  else _collapsedWeeks.add(wi);
  renderExpenses();
}

function renderTagFilter(){
  const cats=[...new Set(cw().flatMap(w=>w.items.map(i=>CAT_LABELS[getCat(i.name)])))];
  document.getElementById('tagFilterBar').innerHTML=
    `<span class="tag-pill${!tagFilter?' sel':''}" data-action="setTagFilter" data-arg="">All</span>`+
    cats.map(c=>`<span class="tag-pill${tagFilter===c?' sel':''}" data-action="setTagFilter" data-arg="${c}">${c}</span>`).join('');
}
function setTagFilter(f){tagFilter=f;renderExpenses();}

function buildRecurringSet(){
  // Returns a Set of lowercased item names that appear in 2+ different months
  const byMonth={};
  Object.values(S.months).forEach(m=>{
    const seen=new Set();
    m.weeks.forEach(w=>w.items.forEach(i=>{
      const k=i.name.trim().toLowerCase();
      if(!seen.has(k)){seen.add(k);byMonth[k]=(byMonth[k]||0)+1;}
    }));
  });
  return new Set(Object.entries(byMonth).filter(([,c])=>c>=2).map(([k])=>k));
}
function detectRecurring(){
  // Count occurrences per MONTH (not per week) to avoid false positives
  const byMonth={};
  Object.entries(S.months).forEach(([mkey,m])=>{
    const seen=new Set();
    m.weeks.forEach(w=>w.items.forEach(i=>{
      const k=i.name.trim().toLowerCase();
      if(!seen.has(k)){
        seen.add(k);
        if(!byMonth[k])byMonth[k]={name:i.name,count:0,amounts:[]};
        byMonth[k].count++;
        // Average amount across months
        const monthAvg=m.weeks.reduce((s,wk)=>s+wk.items.filter(it=>it.name.trim().toLowerCase()===k).reduce((a,it)=>a+it.amount,0),0);
        byMonth[k].amounts.push(monthAvg);
      }
    }));
  });
  return Object.values(byMonth).filter(r=>r.count>=2).sort((a,b)=>b.count-a.count);
}
function isRecurring(name){
  // Count how many DIFFERENT months contain this item name (not weeks within same month)
  const k=name.trim().toLowerCase();
  let monthCount=0;
  Object.values(S.months).forEach(m=>{
    const found=m.weeks.some(w=>w.items.some(i=>i.name.trim().toLowerCase()===k));
    if(found)monthCount++;
  });
  return monthCount>=2;
}

function recurringAutoFill(){
  // Find bills that appear in 2+ previous months but are NOT yet in current month
  const curNames=new Set(cw().flatMap(w=>w.items.map(i=>i.name.trim().toLowerCase())));
  const prevMonths=Object.keys(S.months).filter(k=>k!==CMK);
  const recSet=buildRecurringSet();
  let added=0;
  // For each recurring item not already in current month, add it to week 1
  const seen=new Set();
  prevMonths.forEach(mk=>{
    S.months[mk].weeks.forEach(w=>w.items.forEach(item=>{
      const k=item.name.trim().toLowerCase();
      if(recSet.has(k)&&!curNames.has(k)&&!seen.has(k)){
        seen.add(k);
        cw()[0].items.push({name:item.name,amount:storeCents(item.amount),paid:false,dueDay:item.dueDay||null,note:'',receipt:null});
        added++;
      }
    }));
  });
  if(added>0){persist();renderExpenses();showToast(`✓ Added ${added} recurring bill${added>1?'s':''} to Week 1`);}
  else showToast('No new recurring bills to add','warn-t');
}

// ── DRAG REORDER ──
let _dragSrcWi=-1, _dragSrcIi=-1;
let _cachedCatTotals=null; // shared between renderExpenses and renderEnvelopes
function dragStart(e,wi,ii){
  _dragSrcWi=wi;_dragSrcIi=ii;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed='move';
  e.dataTransfer.setData('text/plain','');
}
function dragOver(e){
  e.preventDefault();e.dataTransfer.dropEffect='move';
  e.currentTarget.classList.add('drag-over');
}
function dragLeave(e){e.currentTarget.classList.remove('drag-over');}
function dragDrop(e,wi,ii){
  e.preventDefault();e.currentTarget.classList.remove('drag-over');
  // Support cross-week drag too
  if(_dragSrcIi===ii&&_dragSrcWi===wi)return; // same slot
  if(_dragSrcWi===wi&&_dragSrcIi!==ii){
    const items=cw()[wi].items;
    const moved=items.splice(_dragSrcIi,1)[0];
    // After splice, if dragging forward the target index shifts by -1
    const targetIdx=_dragSrcIi<ii?ii-1:ii;
    items.splice(targetIdx,0,moved);
    persist();renderExpenses();
  }
}
function dragEnd(e){e.currentTarget.classList.remove('dragging');}

function renderExpenses(){
  document.getElementById('expMonthHdr').textContent=CMK+' Expenses';
  // Guard: if CMK is somehow in archivedMonths, warn and bail
  if(S.archivedMonths && S.archivedMonths[CMK]){
    document.getElementById('weeksGrid').innerHTML=`<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;">&#128274; ${CMK} is archived and read-only.<br><button class="btn-p" style="margin-top:12px;" data-action="openRestoreModal" data-arg="${CMK}">&#128260; Restore to edit</button></div>`;
    return;
  }
  // Pre-compute cat totals once — shared with renderEnvelopes
  _cachedCatTotals=catTotalsForMonth();
  // Ensure correct week count for this month (4 or 5)
  const _parts=CMK.split(' ');const _mo=MS.indexOf(_parts[0]);const _yr=parseInt(_parts[1]);
  const _daysInMonth=new Date(_yr,_mo+1,0).getDate();
  const _firstDay=new Date(_yr,_mo,1).getDay();
  const _weekCount=Math.ceil((_daysInMonth+_firstDay)/7)>=5?5:4;
  while(cw().length<_weekCount)cw().push({items:[]});
  // Trim extra empty weeks, keep exactly _weekCount
  while(cw().length>_weekCount&&cw()[cw().length-1].items.length===0)cw().pop();
  document.getElementById('weeksGrid').style.setProperty('--wk-cols',_weekCount);
  // Show auto-fill button if there are recurring items not yet in this month
  const _recSet=buildRecurringSet();
  const _curNames=new Set(cw().flatMap(w=>w.items.map(i=>i.name.trim().toLowerCase())));
  const _hasNew=[..._recSet].some(k=>!_curNames.has(k));
  const _afBtn=document.getElementById('recurAutoFillBtn');
  if(_afBtn)_afBtn.style.display=_hasNew?'inline-flex':'none';
  renderEnvelopes();
  renderTagFilter();
  const isCurMonth=(()=>{const p=CMK.split(' ');const mo=MS.indexOf(p[0]);const yr=parseInt(p[1]);const n=new Date();return mo===n.getMonth()&&yr===n.getFullYear();})();
  const today=isCurMonth?new Date().getDate():0; // only flag overdue in current real month
  const grid=document.getElementById('weeksGrid');grid.innerHTML='';
  cw().forEach((week,wi)=>{
    const wTotal=week.items.reduce((s,i)=>s+i.amount,0);
    const wPaid=week.items.filter(i=>i.paid).reduce((s,i)=>s+i.amount,0);
    const wPend=wTotal-wPaid;
    const allItemsPaid=week.items.length>0&&week.items.every(i=>i.paid);
    const hasOverdue=week.items.some(i=>i.dueDay&&!i.paid&&i.dueDay<today);
    const hasPartial=!allItemsPaid&&wPaid>0;
    const isCollapsed=_collapsedWeeks.has(wi);
    let statusCls='';
    if(allItemsPaid)statusCls=' all-paid-card';
    else if(hasOverdue)statusCls=' wk-overdue';
    else if(hasPartial)statusCls=' wk-partial';
    const card=document.createElement('div');card.className='week-card'+statusCls+(isCollapsed?' wk-collapsed':'');
    const rows=week.items
      .filter(item=>!tagFilter||CAT_LABELS[getCat(item.name)]===tagFilter)
      .map((item,ii)=>{
        const rec=_recSet.has(item.name.trim().toLowerCase());
        const dd=item.dueDay;
        const isOverdue=dd&&!item.paid&&dd<today;
        const catCls=getCat(item.name);
        const catStyle=getCatStyle(catCls);
        const catLbl=getCatLabel(catCls);
        // Meta row — only show non-empty items to reduce clutter
        const metaParts=[];
        metaParts.push(`<span class="cat-badge ${catCls}" style="${catStyle}">${catLbl}</span>`);
        if(rec)metaParts.push(`<span class="recur-badge" title="Recurring">&#8635;</span>`);
        if(dd)metaParts.push(`<span class="due-badge has-due${isOverdue?' overdue':''}" data-action="openDueDateModal" data-arg="${wi}" data-arg2="${ii}" title="Due day ${dd}">Due ${dd}</span>`);
        // 📋 only when has content; 📷 only when has receipt — shown as tiny icons
        if(item.note)metaParts.push(`<button class="note-toggle has-note" data-action="openNoteModal" data-arg="${wi}" data-arg2="${ii}" title="${item.note.substring(0,40)}">&#128203;</button>`);
        if(item.receipt)metaParts.push(`<button class="receipt-btn has-receipt" data-action="openReceiptModal" data-arg="${wi}" data-arg2="${ii}" title="View receipt">&#128248;</button>`);
        const metaRow=metaParts.length?`<div class="item-meta">${metaParts.join('')}</div>`:'';
        const noteHtml=item.note?`<span class="item-note-inline">${item.note.replace(/</g,'&lt;').substring(0,60)}${item.note.length>60?'…':''}</span>`:'';
        return`<tr draggable="true" data-wi="${wi}" data-ii="${ii}" style="position:relative;" class="${item.paid?'row-paid':''}">
          <td class="item-col">
            <span class="drag-grab-zone" title="Drag to reorder"></span>
            <span class="item-name" data-action="openItemModal" data-arg="${wi}" data-arg2="${ii}" title="Click to edit">${item.name}</span>
            ${metaRow}
            ${noteHtml}
          </td>
          <td class="amt-col" data-action="openItemModal" data-arg="${wi}" data-arg2="${ii}" style="cursor:pointer;"><span class="ea">${fmt(amt(item.amount))}</span></td>
          <td class="status-col"><button class="stog ${item.paid?'paid':'pending'}" data-action="toggleExp" data-arg="${wi}" data-arg2="${ii}" aria-label="${item.paid?'Mark as pending':'Mark as paid'}" title="${item.paid?'Mark as pending':'Mark as paid'}">${item.paid?'✓':'○'}</button></td>
          <td class="action-col no-print">
            <button class="del-btn" data-action="openItemModal" data-arg="${wi}" data-arg2="${ii}" data-stop-prop title="Edit item">&#9998;</button>
            <button class="del-btn" data-action="delExpItem" data-arg="${wi}" data-arg2="${ii}" data-stop-prop aria-label="Delete item" title="Delete item">✕</button>
          </td>
        </tr>`;
      }).join('');
    card.innerHTML=`
      <div class="week-header" style="cursor:pointer;" data-action="toggleWeekCollapse" data-arg="${wi}">
        <div class="week-title-row">
          <span class="week-title">Week ${wi+1}</span>
          <div style="display:flex;align-items:center;gap:5px;">
            <button class="no-print week-collapse-btn" data-action="toggleWeekCollapse" data-arg="${wi}" data-stop-prop title="${isCollapsed?'Expand':'Collapse'} week" aria-label="${isCollapsed?'Expand':'Collapse'} week ${wi+1}">${isCollapsed?'▸':'▾'}</button>
            <button class="no-print" data-action="bulkMarkPaid" data-arg="${wi}" data-stop-prop title="Mark all paid" style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--sage);padding:1px 4px;border-radius:3px;border:1px solid var(--sage-mid);">✓ All</button>
            <span class="week-grand">${fmt(wTotal)}</span>
          </div>
        </div>
        <div class="week-sub-row"><span class="week-sub-stat ws-paid">✓ ${fmt(wPaid)}</span><span class="week-sub-stat ws-pend">⏳ ${fmt(wPend)}</span></div>
      </div>
      ${allItemsPaid?'<div class="week-all-paid-banner"><span>🎉</span> All paid!</div>':''}
      <table class="week-table"><thead><tr><th>Item</th><th style="text-align:right;padding-right:6px;font-size:9px;color:var(--text-muted);">Amount</th><th style="width:30px;"></th><th style="width:40px;" class="no-print"></th></tr></thead><tbody>${rows||'<tr><td colspan="4" style="text-align:center;color:var(--text-muted);font-size:11px;padding:12px;">No items in this category</td></tr>'}</tbody></table>
      <button class="add-row-btn no-print" data-action="openItemModal" data-arg="${wi}" data-arg2="-1">+ Add Item</button>`;
    grid.appendChild(card);
  });
  const gt=totalExp(),gp=paidExp(),gpd=pendExp();
  document.getElementById('ef-total').textContent=fmt(gt);
  document.getElementById('ef-paid').textContent=fmt(gp);
  document.getElementById('ef-pending').textContent=fmt(gpd);
  document.getElementById('ef-pnote').textContent=gpd>0?((gpd/gt*100).toFixed(0)+'% still due'):'✓ All paid';
  document.getElementById('overBudgetPill').style.display=gt>totalRev()?'inline-flex':'none';
  renderExpSumChart();
}

// Debounced rename
function renameItem(e,wi,ii){
  if(_blurLk)return;_blurLk=true;setTimeout(()=>_blurLk=false,200);
  const orig=e.target.dataset.orig||'';
  const newName=e.target.textContent.trim();
  if(newName&&newName!==orig){cw()[wi].items[ii].name=newName;persist();renderExpenses();}
}
function editAmt(el,wi,ii){
  const old=cw()[wi].items[ii].amount;
  el.innerHTML=`<input class="ie" type="number" value="${old}" onblur="saveAmt(this,${wi},${ii})" onkeydown="if(event.key==='Enter')this.blur()" autofocus>`;
  el.querySelector('input').select();
}
function saveAmt(inp,wi,ii){cw()[wi].items[ii].amount=storeCents(inp.value);persist();renderExpenses();updateHealth();}

// ── SURGICAL EXPENSE ROW UPDATE ──
// Updates only the changed row + week totals + footer — skips full DOM rebuild
function updateExpRowSurgical(wi, ii){
  const item = cw()[wi].items[ii];
  if(!item) return false; // fallback to full render if stale

  // 1. Update the row class (paid/unpaid strikethrough)
  const rows = document.querySelectorAll(`#weeksGrid .week-card:nth-child(${wi+1}) .week-table tbody tr`);
  // Find the right row — filter is applied, so we match by data attributes
  const allRows = document.querySelectorAll(`#weeksGrid .week-card:nth-child(${wi+1}) tr[data-ii]`);
  let targetRow = null;
  allRows.forEach(r => { if(parseInt(r.dataset.ii)===ii && parseInt(r.dataset.wi)===wi) targetRow=r; });
  if(!targetRow) return false;

  // Update row paid class
  targetRow.classList.toggle('row-paid', item.paid);

  // Update the stog button
  const stog = targetRow.querySelector('.stog');
  if(stog){
    stog.className = 'stog ' + (item.paid ? 'paid' : 'pending');
    stog.textContent = item.paid ? '✓' : '○';
    stog.setAttribute('aria-label', item.paid ? 'Mark as pending' : 'Mark as paid');
    stog.setAttribute('title',      item.paid ? 'Mark as pending' : 'Mark as paid');
  }

  // 2. Recompute week totals
  const week = cw()[wi];
  const wTotal = week.items.reduce((s,i)=>s+amt(i.amount),0);
  const wPaid  = week.items.filter(i=>i.paid).reduce((s,i)=>s+amt(i.amount),0);
  const wPend  = wTotal - wPaid;
  const allItemsPaid = week.items.length>0 && week.items.every(i=>i.paid);

  // 3. Update week card header
  const card = targetRow.closest('.week-card');
  if(card){
    card.classList.toggle('all-paid-card', allItemsPaid);
    const grandEl = card.querySelector('.week-grand');
    if(grandEl) grandEl.textContent = fmt(wTotal);
    const paidEl  = card.querySelector('.ws-paid');
    if(paidEl)  paidEl.textContent = '✓ ' + fmt(wPaid);
    const pendEl  = card.querySelector('.ws-pend');
    if(pendEl)  pendEl.textContent = '⏳ ' + fmt(wPend);
    // All-paid banner
    let banner = card.querySelector('.week-all-paid-banner');
    if(allItemsPaid && !banner){
      banner = document.createElement('div');
      banner.className = 'week-all-paid-banner';
      banner.innerHTML = '<span>🎉</span> All paid!';
      const hdr = card.querySelector('.week-header');
      if(hdr) hdr.after(banner);
    } else if(!allItemsPaid && banner){
      banner.remove();
    }
  }

  // 4. Update footer totals (no chart re-render)
  const gt = totalExp(), gp = paidExp(), gpd = pendExp();
  const efTotal = document.getElementById('ef-total');
  const efPaid  = document.getElementById('ef-paid');
  const efPend  = document.getElementById('ef-pending');
  const efNote  = document.getElementById('ef-pnote');
  const overPill= document.getElementById('overBudgetPill');
  if(efTotal) efTotal.textContent = fmt(gt);
  if(efPaid)  efPaid.textContent  = fmt(gp);
  if(efPend)  efPend.textContent  = fmt(gpd);
  if(efNote)  efNote.textContent  = gpd>0 ? (gpd/gt*100).toFixed(0)+'% still due' : '✓ All paid';
  if(overPill) overPill.style.display = gt>totalRev() ? 'inline-flex' : 'none';

  return true; // surgical update succeeded
}

function toggleExp(wi,ii){
  const item=cw()[wi].items[ii];
  const wasPaid=item.paid;
  item.paid=!item.paid;
  persist();
  // Surgical update — only rebuilds the changed row and week totals
  const ok=updateExpRowSurgical(wi,ii);
  if(!ok) renderExpenses(); // fallback: full rebuild if DOM is stale
  updateHealth();
  if(!wasPaid){
    const btn=document.querySelector('.week-table .stog.paid');
    launchConfettiFromEl(btn,22);
    const weekDone=cw()[wi].items.length>0&&cw()[wi].items.every(i=>i.paid);
    if(weekDone){
      setTimeout(()=>{launchConfetti(110);showToast('🎉 Week '+(wi+1)+' — all paid!');},300);
    }
    setTimeout(checkMonthComplete,600);
  }
}
function delExpItem(wi,ii){cw()[wi].items.splice(ii,1);persist();renderExpenses();updateHealth();}
function bulkMarkPaid(wi){
  const allPaid=cw()[wi].items.every(i=>i.paid);
  cw()[wi].items.forEach(i=>i.paid=!allPaid);
  persist();renderExpenses();updateHealth();
  if(!allPaid){
    launchConfetti(110);
    showToast('🎉 Week '+(wi+1)+' — all paid!');
  } else {
    showToast('All items reset to pending');
  }
}
function addExpItem(wi){openItemModal(wi,-1);} // now opens modal

// ── DUE DATE MODAL ──
function openDueDateModal(wi,ii){ openItemModal(wi,ii); }
function closeDueDateModal(){document.getElementById('dueDateModal').classList.remove('open');}
function saveDueDate(){
  const d=parseInt(document.getElementById('dueDayInput').value);
  if(d>=1&&d<=31)cw()[_pendingDueWi].items[_pendingDueIi].dueDay=d;
  persist();closeDueDateModal();renderExpenses();renderCalendar();
}
function clearDueDate(){cw()[_pendingDueWi].items[_pendingDueIi].dueDay=null;persist();closeDueDateModal();renderExpenses();}
