// === calendar.js ===

// ══════════════════════════════════════════════
// CALENDAR  — driven by item.dueDay
// ══════════════════════════════════════════════
function renderCalendar(){
  checkAndRemind();
  const parts=CMK.split(' ');const mo=MS.indexOf(parts[0]);const yr=parseInt(parts[1]);
  document.getElementById('calMonthTitle').textContent=CMK;
  document.getElementById('calMonTitle2').textContent=CMK;
  const firstDay=new Date(yr,mo,1).getDay();
  const daysInMonth=new Date(yr,mo+1,0).getDate();
  const _now=new Date();
  const todayDate=_now.getDate();
  const isCurrMonth=(mo===_now.getMonth()&&yr===_now.getFullYear());

  // Group items by dueDay — only items WITH a dueDay
  const byDay={};
  cw().forEach(w=>w.items.forEach(item=>{
    if(item.dueDay&&item.dueDay>=1&&item.dueDay<=31){
      const d=Math.min(item.dueDay,daysInMonth);
      if(!byDay[d])byDay[d]=[];
      byDay[d].push(item);
    }
  }));

  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  document.getElementById('calHdrRow').innerHTML=days.map(d=>`<div class="cal-hdr-day">${d}</div>`).join('');

  let html='';
  for(let d=0;d<firstDay;d++)html+='<div></div>';
  for(let d=1;d<=daysInMonth;d++){
    const bills=byDay[d]||[];
    const allPaid=bills.length>0&&bills.every(b=>b.paid);
    const isToday=isCurrMonth&&d===todayDate; // only highlight today in the actual current month
    let cls='cal-day';
    if(isToday)cls+=' today';
    else if(allPaid&&bills.length)cls+=' all-paid';
    else if(bills.length)cls+=' has-bill';
    html+=`<div class="${cls}">
      <div class="cdn">${d}</div>
      ${bills.slice(0,2).map(b=>`<span class="bill-chip${b.paid?' paid':''}" title="${b.name}: ${fmt(b.amount)}">${b.name.split(' ')[0]}</span>`).join('')}
      ${bills.length>2?`<span class="bill-chip">+${bills.length-2}</span>`:''}
    </div>`;
  }
  document.getElementById('billCal').innerHTML=html;

  // Upcoming list
  const upcoming=Object.entries(byDay).sort((a,b)=>parseInt(a[0])-parseInt(b[0]));
  document.getElementById('upcomingBills').innerHTML=upcoming.length
    ?upcoming.map(([day,items])=>`
      <div style="padding:8px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;">
        <div style="min-width:28px;height:28px;border-radius:50%;background:var(--sage-light);color:var(--sage);font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center;">${day}</div>
        <div style="flex:1;">
          ${items.map(i=>`<div style="display:flex;justify-content:space-between;font-size:12px;"><span>${i.name}${i.paid?' <span style="color:var(--success);font-size:10px;">✓</span>':''}</span><span class="acol" style="font-size:12px;">${fmt(i.amount)}</span></div>`).join('')}
        </div>
      </div>`).join('')
    :`<div style="padding:20px 16px;text-align:center;"><div style="font-size:28px;margin-bottom:8px;">📅</div><div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:6px;">No bills scheduled yet</div><div style="font-size:12px;color:var(--text-muted);line-height:1.6;margin-bottom:12px;">Open the <strong>Expenses</strong> tab, click any item, and set its <strong>Due Date</strong> — it will appear on the calendar automatically.</div><button class="nm-btn" data-action="switchToExpensesTab" style="font-size:12px;padding:7px 16px;">Go to Expenses →</button></div>`;

  // Recurring
  const rec=detectRecurring();
  document.getElementById('recurringList').innerHTML=rec.length
    ?rec.map(r=>{const avg=r.amounts.reduce((s,v)=>s+v,0)/r.amounts.length;return`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;"><span><span class="recur-badge">↺</span> <strong>${r.name}</strong></span><span style="font-family:'DM Mono',monospace;color:var(--text-secondary);">${r.count}× avg ${fmt(avg)}</span></div>`;}).join('')
    :'<p style="color:var(--text-muted);font-size:12px;">Add more months to detect recurring bills.</p>';
}
