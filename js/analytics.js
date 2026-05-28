// === analytics.js ===

function renderAnalytics(){
  const keys=Object.keys(S.months);
  const revs=keys.map(k=>totalRev(k));
  const exps=keys.map(k=>totalExp(k));
  const nets=keys.map((k,i)=>revs[i]-exps[i]);
  const avgInc=revs.reduce((s,v)=>s+v,0)/(revs.length||1);
  const avgExp=exps.reduce((s,v)=>s+v,0)/(exps.length||1);
  document.getElementById('an-avginc').textContent=fmt(avgInc);
  document.getElementById('an-avgexp').textContent=fmt(avgExp);
  const bi=nets.indexOf(Math.max(...nets));
  document.getElementById('an-best').textContent=keys[bi]||'—';
  const catTotals={};keys.forEach(k=>S.months[k].weeks.forEach(w=>w.items.forEach(i=>{const c=CAT_LABELS[getCat(i.name)];catTotals[c]=(catTotals[c]||0)+i.amount;})));
  const topCat=Object.entries(catTotals).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('an-topcat').textContent=topCat?topCat[0]:'—';
  // YoY
  const years=[...new Set(keys.map(k=>k.split(' ')[1]))];
  document.getElementById('yoyTable').innerHTML=years.length>1
    ?`<table><thead><tr><th>Year</th><th class="acol">Income</th><th class="acol">Expenses</th><th class="acol">Net</th></tr></thead><tbody>${years.map(yr=>{const yk=keys.filter(k=>k.endsWith(yr));const yi=yk.reduce((s,k)=>s+totalRev(k),0),ye=yk.reduce((s,k)=>s+totalExp(k),0),yn=yi-ye;return`<tr><td>${yr}</td><td class="acol" style="color:var(--success);">${fmt(yi)}</td><td class="acol" style="color:var(--danger);">${fmt(ye)}</td><td class="acol" style="color:${yn>=0?'var(--success)':'var(--danger)'};">${yn<0?'-':''}${fmt(Math.abs(yn))}</td></tr>`;}).join('')}</tbody></table>`
    :'<p style="color:var(--text-muted);font-size:12px;">Add months across multiple years to see year-over-year data.</p>';
  // Insights
  const ins=genInsights(keys,revs,exps,nets,catTotals);
  document.getElementById('insightsList').innerHTML=ins.map(i=>`<div class="insight-item"><span style="font-size:18px;">${i.icon}</span><div><div style="font-weight:600;font-size:13px;margin-bottom:2px;">${i.title}</div><div style="font-size:12px;color:var(--text-secondary);">${i.body}</div></div></div>`).join('');
  renderCatTrend(keys);renderNetChart(keys,nets);
  renderVarianceTable(keys);
  renderShortfallBanner();
  updateAIActionGrid();
  // Scorecard history — all closed months (i.e. not the current month)
  var scRow=document.getElementById('an-scorecard-row');
  if(scRow){
    var past=keys.filter(function(k){return k!==CMK;});
    if(!past.length){
      scRow.innerHTML='<span style="font-size:11px;color:var(--text-muted);">No closed months yet — scorecards appear here after you close your first month.</span>';
    } else {
      scRow.innerHTML=past.map(function(k){
        return '<button class="tbtn" style="font-size:11px;" data-action="openScorecardModal" data-arg="'+k+'">'+k+'</button>';
      }).join('');
    }
  }
}

function renderVarianceTable(keys){
  const wrap=document.getElementById('varianceTableWrap');
  const last3=keys.slice(-3);
  if(!last3.length){
    wrap.innerHTML='<p style="font-size:12px;color:var(--text-muted);padding:8px 0;">No month data yet — add expenses to see budget vs actual variance.</p>';
    return;
  }
  // Build actuals per category, but only for categories that have real spending
  const cats=Object.keys(S.budgets||BDFT);
  const catData=cats.map(cat=>{
    const actuals=last3.map(k=>{
      const md=S.months[k];
      if(!md) return 0;
      return md.weeks.reduce((s,w)=>s+w.items.filter(i=>CAT_LABELS[getCat(i.name)]===cat).reduce((a,i)=>a+i.amount,0),0);
    });
    const hasData=actuals.some(a=>a>0);
    return{cat,actuals,hasData};
  }).filter(d=>d.hasData);

  if(!catData.length){
    wrap.innerHTML='<p style="font-size:12px;color:var(--text-muted);padding:8px 0;">No categorised expenses in the last '+(last3.length===1?'month':'3 months')+'  — add expenses to see variance.</p>';
    return;
  }

  const rows=catData.map(({cat,actuals})=>{
    const cap=S.budgets[cat]||BDFT[cat]||0;
    const variances=actuals.map(a=>cap-a);
    const trend=actuals.length>=2?actuals[actuals.length-1]-actuals[actuals.length-2]:0;
    return`<tr>
      <td style="font-weight:500;font-size:12px;">${cat}</td>
      <td class="acol" style="font-size:12px;font-family:'DM Mono',monospace;">${cap?fmt(cap):'—'}</td>
      ${actuals.map(a=>`<td class="acol" style="font-size:12px;font-family:'DM Mono',monospace;background:${cap&&a>cap?'var(--danger-light)':cap&&a>cap*.8?'var(--amber-light)':'transparent'}">${fmt(a)}</td>`).join('')}
      ${variances.map(v=>`<td class="acol"><span class="${v>=0?'var-pos':'var-neg'}">${cap?(v>=0?'+':'')+fmt(v):'—'}</span></td>`).join('')}
      <td class="acol"><span class="var-arrow">${actuals.length>=2?(trend>0?'▲':'▼'):'—'}</span></td>
    </tr>`;
  }).join('');

  const thead=`<tr><th>Category</th><th class="acol">Budget</th>${last3.map(k=>`<th class="acol">${k}</th>`).join('')}${last3.map(k=>`<th class="acol">Var ${k.split(' ')[0]}</th>`).join('')}<th class="acol">Trend</th></tr>`;
  wrap.innerHTML=`<table class="variance-table"><thead>${thead}</thead><tbody>${rows}</tbody></table>`;
}

function genInsights(keys,revs,exps,nets,catTotals){
  const ins=[];
  const dti=totalRev()>0?minPmts()/totalRev()*100:0;
  if(dti>40)ins.push({icon:'⚠️',title:'High DTI ratio',body:`Loan payments consume ${dti.toFixed(0)}% of income. Recommended: below 36%.`});
  else if(dti<20)ins.push({icon:'✅',title:'Healthy DTI ratio',body:`Your DTI of ${dti.toFixed(0)}% is well within healthy range.`});
  if(keys.length>=2){const t=revs[revs.length-1]-revs[revs.length-2];if(t>0)ins.push({icon:'📈',title:'Income trending up',body:`Income up ${fmt(t)} vs last month.`});else if(t<0)ins.push({icon:'📉',title:'Income dip',body:`Income down ${fmt(Math.abs(t))} vs last month.`});}
  const top=Object.entries(catTotals).sort((a,b)=>b[1]-a[1])[0];
  if(top)ins.push({icon:'💡',title:`Top spend: ${top[0]}`,body:`${fmt(top[1])} total across all months.`});
  const sv=totalSav(),dt=totalDebt();
  if(sv>0&&dt>0)ins.push({icon:'⚖️',title:'Savings vs Debt',body:`${fmt(sv)} in savings vs ${fmt(dt)} in debt. High-interest debt may cost more than savings earn.`});
  const hi=S.loans.filter(l=>l.rate>20);
  if(hi.length)ins.push({icon:'🔥',title:`${hi.length} high-interest loan${hi.length>1?'s':''}`,body:`${hi.map(l=>l.name).join(', ')} above 20%. Prioritise these.`});
  const pp=totalRev()>0?pendExp()/totalRev()*100:0;
  if(pp>50)ins.push({icon:'⏳',title:'High pending ratio',body:`${pp.toFixed(0)}% of income tied in unpaid bills.`});
  return ins.length?ins:[{icon:'🎯',title:'Add more data',body:'More months = more personalised insights here.'}];
}

function _buildFinancialContext(monthCount){
  monthCount=monthCount||6;
  var keys=Object.keys(S.months).slice(-monthCount);
  return{
    months:keys.map(function(k){
      var cats={};
      S.months[k].weeks.forEach(function(w){w.items.forEach(function(i){var c=CAT_LABELS[getCat(i.name)];cats[c]=(cats[c]||0)+i.amount;});});
      return{month:k,income:totalRev(k),expenses:totalExp(k),net:totalRev(k)-totalExp(k),
        topCategories:Object.entries(cats).sort(function(a,b){return b[1]-a[1];}).slice(0,5).map(function(e){return{category:e[0],amount:e[1]};})};
    }),
    loans:S.loans.map(function(l){return{name:l.name,balance:l.amount,rate:l.rate,minPayment:l.minPayment};}),
    savings:(S.savings||[]).map(function(g){return{name:g.name,balance:g.balance,target:g.target,rate:g.rate||0};}),
    budgets:S.budgets||BDFT,
    totalDebt:totalDebt(),totalSavings:totalSav(),
    currentMonthIncome:totalRev(),currentMonthExpenses:totalExp(),currentMonthNet:totalRev()-totalExp(),
    unpaidThisMonth:cm().weeks.reduce(function(s,w){return s+w.items.filter(function(i){return!i.paid;}).reduce(function(a,i){return a+amt(i.amount);},0);},0),
    dti:totalRev()>0?(minPmts()/totalRev()*100).toFixed(1)+'%':'N/A'
  };
}

function _getModeLabel(mode){
  return{general:'General Insights',debt:'Debt Optimizer',anomaly:'Spending Anomalies',budget:'Budget Recommender',summary:'Monthly Summary',forecast:'Cash Flow Forecast',qa:'Your Question'}[mode]||mode;
}

// ══════════════════════════════════════════════
// CHARTS
// ══════════════════════════════════════════════
const CH={};
function dc(id){if(CH[id]){try{CH[id].destroy();}catch(e){}delete CH[id];}}

// Smart chart update — animates data changes instead of destroy+recreate
function uc(id, newData, newOptions){
  if(CH[id]){
    // Update existing chart smoothly
    const c = CH[id];
    c.data.labels = newData.labels;
    newData.datasets.forEach((ds,i)=>{
      if(c.data.datasets[i]){
        c.data.datasets[i].data = ds.data;
        // Update colours if changed (e.g. dark mode toggle)
        if(ds.backgroundColor !== undefined) c.data.datasets[i].backgroundColor = ds.backgroundColor;
        if(ds.borderColor !== undefined) c.data.datasets[i].borderColor = ds.borderColor;
      } else {
        c.data.datasets.push(ds);
      }
    });
    // Trim extra datasets if count reduced
    if(c.data.datasets.length > newData.datasets.length)
      c.data.datasets.splice(newData.datasets.length);
    c.update('active'); // smooth animated transition
    return;
  }
  // Chart doesn't exist yet — create fresh
  const canvas = document.getElementById(id);
  if(!canvas) return;
  CH[id] = new Chart(canvas, { data: newData, ...newOptions });
}


function renderPaydownChart(){
  dc('pd');
  const COLS=['#C53030','#B8860B','#276749','#5C7A6B','#2B6CB0','#6B46C1'];
  const vm=S.loans.map(l=>calcMTP(amt(l.amount),l.rate,amt(l.minPayment))).filter(m=>m<999);
  if(!vm.length)return;
  const maxMo=Math.min(120,Math.max(...vm));
  const labels=Array.from({length:maxMo+1},(_,i)=>i===0?'Now':i%12===0?'Yr '+(i/12):i%6===0?'Mo '+i:'');
  const datasets=S.loans.map((l,li)=>{
    const r=l.rate/100/12;let bal=amt(l.amount);const d=[Math.round(bal*100)/100];
    for(let m=1;m<=maxMo;m++){if(bal<=0.01){d.push(0);continue;}bal=Math.max(0,bal-(amt(l.minPayment)-bal*r));d.push(Math.round(bal*100)/100);}
    return{label:l.name,data:d,borderColor:COLS[li%COLS.length],backgroundColor:'transparent',borderWidth:2,pointRadius:0,pointHoverRadius:4,tension:.3};
  });
  CH['pd']=new Chart(document.getElementById('paydownChart'),{type:'line',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{font:{size:10},padding:8,boxWidth:12,generateLabels:c=>c.data.datasets.map((ds,i)=>({text:ds.label,fillStyle:'transparent',strokeStyle:ds.borderColor,lineWidth:2,hidden:false,index:i,datasetIndex:i}))}}},scales:{x:{grid:{display:false},ticks:{font:{size:9},maxRotation:0}},y:{ticks:{callback:v=>fmtK(v),font:{size:9}},grid:{color:'rgba(0,0,0,0.03)'}}}}});
}

function renderSavingsChart(goals){
  dc('savChart');
  if(!goals||!goals.length)return;
  const p=CMK.split(' ');let baseMo=MS.indexOf(p[0]);const baseYr=parseInt(p[1]);
  const months=12;
  const labels=Array.from({length:months+1},(_,i)=>{let mo=(baseMo+i)%12,yr=baseYr+Math.floor((baseMo+i)/12);return MS[mo]+' '+yr;});
  const COLS=['#2B6CB0','#276749','#B8860B','#6B46C1','#C53030'];
  const datasets=goals.map((g,gi)=>{
    let bal=amt(g.balance);const data=[Math.round(bal*100)/100];
    for(let m=1;m<=months;m++){bal=bal*(1+g.rate/100/12)+amt(g.contribution);data.push(Math.round(bal*100)/100);}
    return{label:g.name,data,borderColor:COLS[gi%COLS.length],backgroundColor:'transparent',borderWidth:2,pointRadius:2,tension:.3};
  });
  // Also show debt paydown for correlation
  let totalD=totalDebt();const debtData=[totalD];
  for(let m=1;m<=months;m++){totalD=Math.max(0,totalD-minPmts());debtData.push(parseFloat(totalD.toFixed(2)));}
  datasets.push({label:'Debt Remaining',data:debtData,borderColor:'#C53030',backgroundColor:'rgba(197,48,48,.06)',borderWidth:2,borderDash:[5,3],pointRadius:0,fill:true,tension:.3});
  CH['savChart']=new Chart(document.getElementById('savChart'),{type:'line',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{font:{size:10},padding:8,boxWidth:12}}},scales:{x:{grid:{display:false},ticks:{font:{size:9}}},y:{ticks:{callback:v=>fmtK(v),font:{size:9}},grid:{color:'rgba(0,0,0,0.03)'}}}}});
}

function _dashGreeting(){
  const score=calcHealth().total;
  const mood=score>=100?'🌟':score>=75?'😄':score>=51?'😊':score>=26?'😐':'😰';
  const h=new Date().getHours();
  const name=S.userName?', '+S.userName:'';
  const time=h>=5&&h<12?'Good morning':h>=12&&h<17?'Good afternoon':h>=17&&h<21?'Good evening':'Good night';
  return mood+' '+time+name;
}
function renderDash(){
  const exp=totalExp(), paid=paidExp(), pend=pendExp(), rev=totalRev(), debt=totalDebt(), net=Math.round((rev-exp)*100)/100;
  const sv=totalSav(), mp=minPmts(), dti=rev>0?mp/rev*100:0;
  const {total:healthScore}=calcHealth();

  // ── GREETING ──
  const greetEl=document.getElementById('d-greeting');
  if(greetEl) greetEl.textContent=_dashGreeting();

  // ── HERO ──
  document.getElementById('d-hero-month').textContent=CMK;
  const cfEl=document.getElementById('d-cashflow');
  cfEl.textContent=(net<0?'-':'')+fmt(Math.abs(net));
  cfEl.className='hero-net '+(net>=0?'pos':'neg');
  document.getElementById('d-hero-sub').innerHTML='Income '+fmt(rev)+'&nbsp;·&nbsp; Expenses '+fmt(exp)+'&nbsp;·&nbsp; Pending '+fmt(pend);

  // Hero badges
  const keys=Object.keys(S.months), idx=keys.indexOf(CMK);
  const momEl=document.getElementById('d-hero-mom');
  momEl.textContent='';momEl.className='hero-badge hb-neutral';
  if(idx>0){
    const prevNet=totalRev(keys[idx-1])-totalExp(keys[idx-1]);
    const diff=net-prevNet;
    if(diff!==0){
      momEl.textContent=(diff>0?'▲ ':'▼ ')+fmtK(Math.abs(diff))+' vs '+keys[idx-1].split(' ')[0];
      momEl.className='hero-badge '+(diff>0?'hb-pos':'hb-neg');
      momEl.style.display='';
    }
  }
  const pendPct=exp>0?Math.round(pend/exp*100):0;
  const pendBadge=document.getElementById('d-hero-pending');
  if(exp>0&&pend>0){pendBadge.textContent=pendPct+'% bills pending';pendBadge.className='hero-badge hb-warn';pendBadge.style.display='';}
  else if(exp>0&&pend===0){pendBadge.textContent='All paid ✓';pendBadge.className='hero-badge hb-pos';pendBadge.style.display='';}
  else{pendBadge.style.display='none';}
  const hEl=document.getElementById('d-hero-health');
  hEl.textContent='Health '+healthScore+'/100';
  hEl.className='hero-badge '+(healthScore>=75?'hb-pos':healthScore>=50?'hb-warn':'hb-neg');

  // ── KPI ROW ──
  document.getElementById('d-income').textContent=fmt(rev);
  document.getElementById('d-expenses').textContent=fmt(exp);
  document.getElementById('d-pending').textContent=fmt(pend);
  document.getElementById('d-debt').textContent=fmt(debt);
  document.getElementById('d-savings').textContent=fmt(sv);
  document.getElementById('d-minpmts').textContent=fmt(mp);

  // KPI deltas
  const incD=document.getElementById('d-inc-d'), expD=document.getElementById('d-exp-d');
  incD.textContent='';incD.className='dkd';incD.style.display='none';expD.textContent='';expD.className='dkd';expD.style.display='none';
  if(idx>0){
    const pR=totalRev(keys[idx-1]),pE=totalExp(keys[idx-1]);
    const dR=rev-pR,dE=exp-pE;
    if(dR!==0){incD.textContent=(dR>0?'▲ ':'▼ ')+fmtK(Math.abs(dR));incD.className='dkd '+(dR>0?'dp':'dn');incD.style.display='';}
    if(dE!==0){expD.textContent=(dE>0?'▲ ':'▼ ')+fmtK(Math.abs(dE));expD.className='dkd '+(dE<0?'dp':'dn');expD.style.display='';}
  }
  const pendSubEl=document.getElementById('d-pend-sub');
  pendSubEl.textContent=pendPct+'% still due';
  const savSubEl=document.getElementById('d-sav-sub');
  const savGoals=S.savings||[];
  const savDone=savGoals.filter(g=>amt(g.balance)>=amt(g.target)).length;
  savSubEl.textContent=savDone+' / '+savGoals.length+' goals met';
  const dtiLbl=document.getElementById('d-dti-lbl');
  dtiLbl.textContent='DTI '+dti.toFixed(1)+'%';
  dtiLbl.style.background=dti>40?'var(--danger-light)':dti>28?'var(--amber-light)':'var(--success-light)';
  dtiLbl.style.color=dti>40?'var(--danger)':dti>28?'var(--amber)':'var(--success)';
  document.getElementById('d-dti').textContent=fmt(mp);

  // ── UPCOMING BILLS ──
  document.getElementById('d-cat-month').textContent=CMK;
  const today=new Date().getDate();
  const isCurMonth=(()=>{const p=CMK.split(' ');return MS.indexOf(p[0])===new Date().getMonth()&&parseInt(p[1])===new Date().getFullYear();})();
  const billsByDay={};
  cw().forEach(w=>w.items.forEach(item=>{
    if(item.dueDay){
      if(!billsByDay[item.dueDay])billsByDay[item.dueDay]=[];
      billsByDay[item.dueDay].push(item);
    }
  }));
  const billEntries=Object.entries(billsByDay)
    .sort((a,b)=>parseInt(a[0])-parseInt(b[0]))
    .filter(([d])=>!isCurMonth||parseInt(d)>=today);
  const billsEl=document.getElementById('d-bills-list');
  const billCountEl=document.getElementById('d-bills-count');
  if(!billEntries.length){
    billsEl.innerHTML='<div style="padding:12px 0;font-size:12px;color:var(--text-muted);text-align:center;">No upcoming bills with due dates set.<br><span style="font-size:11px;">Set due dates in Expenses tab.</span></div>';
    billCountEl.textContent='';
  } else {
    const pendingBillCount=billEntries.reduce((s,[,items])=>s+items.filter(i=>!i.paid).length,0);
    billCountEl.textContent=pendingBillCount+' pending';
    billsEl.innerHTML=billEntries.slice(0,6).map(([day,items])=>{
      const daysUntil=isCurMonth?parseInt(day)-today:-1;
      const dotCls=daysUntil>=0&&daysUntil<=3?'bdd-urgent':daysUntil>=0&&daysUntil<=7?'bdd-soon':'bdd-ok';
      const total=items.reduce((s,i)=>s+i.amount,0);
      const allPaid=items.every(i=>i.paid);
      return`<div class="bill-row">
        <div class="bill-day-dot ${dotCls}">${day}</div>
        <div class="bn">${items.length===1?items[0].name:items.length+' bills'}</div>
        <div class="ba">${fmt(total)}</div>
        <span class="bs ${allPaid?'bs-paid':'bs-pend'}">${allPaid?'Paid':'Due'}</span>
      </div>`;
    }).join('');
  }

  // ── CHARTS ──
  // Trend chart — 6 month income vs expenses
  const tk=keys.slice(-6);
  if(!CH['tr']){
    dc('tr');
    CH['tr']=new Chart(document.getElementById('trendChart'),{type:'line',data:{labels:tk,datasets:[{label:'Income',data:tk.map(k=>totalRev(k)),borderColor:'#276749',backgroundColor:'rgba(39,103,73,.07)',borderWidth:2,pointRadius:3,pointHoverRadius:5,fill:true,tension:.4},{label:'Expenses',data:tk.map(k=>totalExp(k)),borderColor:'#C53030',backgroundColor:'rgba(197,48,48,.05)',borderWidth:2,pointRadius:3,pointHoverRadius:5,fill:true,tension:.4}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': '+fmt(ctx.raw)}}},scales:{x:{grid:{display:false},ticks:{font:{size:9},maxRotation:0}},y:{ticks:{callback:v=>fmtK(v),font:{size:9}},grid:{color:'rgba(0,0,0,.03)'}}}}});
  } else {
    CH['tr'].data.labels=tk;
    CH['tr'].data.datasets[0].data=tk.map(k=>totalRev(k));
    CH['tr'].data.datasets[1].data=tk.map(k=>totalExp(k));
    CH['tr'].update('active');
  }

  // Category donut
  const catT={};cw().forEach(w=>w.items.forEach(i=>{const c=getCatLabel(getCat(i.name));catT[c]=(catT[c]||0)+i.amount;}));

  const dark=document.body.classList.contains('dark');
  const catKeys=Object.keys(catT).filter(k=>catT[k]>0);
  const catVals=catKeys.map(k=>catT[k]);
  const catBgs=catKeys.map(c=>catColors[c]||'#A0AEC0');
  const _catTotal=catVals.reduce((a,b)=>a+b,0)||1;
  if(!CH['cat']||JSON.stringify(CH['cat'].data.labels)!==JSON.stringify(catKeys)){
    dc('cat');
    CH['cat']=new Chart(document.getElementById('categoryChart'),{type:'doughnut',data:{labels:catKeys,datasets:[{data:catVals,backgroundColor:catBgs,borderWidth:2,borderColor:dark?'#222536':'#fff',hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'right',labels:{font:{size:9},padding:6,boxWidth:9}},tooltip:{callbacks:{label:ctx=>ctx.label+': '+fmt(ctx.raw)+' ('+Math.round(ctx.raw/_catTotal*100)+'%)'}}}}});
  } else {
    CH['cat'].data.datasets[0].data=catVals;
    CH['cat'].data.datasets[0].borderColor=dark?'#222536':'#fff';
    CH['cat'].update('active');
  }

  // Weekly stacked bar
  const wkLabels=cw().map((_,i)=>'Wk '+(i+1));
  const _wkPaid=cw().map(w=>w.items.filter(i=>i.paid).reduce((s,i)=>s+i.amount,0));
  const _wkPend=cw().map(w=>w.items.filter(i=>!i.paid).reduce((s,i)=>s+i.amount,0));
  if(!CH['wk']){
    dc('wk');
    CH['wk']=new Chart(document.getElementById('weeklyChart'),{type:'bar',data:{labels:wkLabels,datasets:[{label:'Paid',data:_wkPaid,backgroundColor:'#276749',borderRadius:3,stack:'w'},{label:'Pending',data:_wkPend,backgroundColor:'#B7791F',borderRadius:3,stack:'w'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': '+fmt(ctx.raw)}}},scales:{x:{stacked:true,grid:{display:false},ticks:{font:{size:10}}},y:{stacked:true,ticks:{callback:v=>fmtK(v),font:{size:9}},grid:{color:'rgba(0,0,0,.03)'}}}}});
  } else {
    CH['wk'].data.labels=wkLabels;
    CH['wk'].data.datasets[0].data=_wkPaid;
    CH['wk'].data.datasets[1].data=_wkPend;
    CH['wk'].update('active');
  }

  // Cash flow bar
  const _cfData=[rev,exp,mp,Math.abs(net)];
  const _cfColors=['#276749','#C53030','#B7791F',net>=0?'#5C7A6B':'#C53030'];
  if(!CH['cf']){
    dc('cf');
    CH['cf']=new Chart(document.getElementById('cashflowChart'),{type:'bar',data:{labels:['Income','Expenses','Loan Pmts','Net'],datasets:[{data:_cfData,backgroundColor:_cfColors,borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>fmt(ctx.raw)}}},scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{ticks:{callback:v=>fmtK(v),font:{size:9}},grid:{color:'rgba(0,0,0,.03)'}}}}});
  } else {
    CH['cf'].data.datasets[0].data=_cfData;
    CH['cf'].data.datasets[0].backgroundColor=_cfColors;
    CH['cf'].update('active');
  }

  // ── EXPENSE PROGRESS BARS ──
  const expTotal=exp||1;
  document.getElementById('d-epb-paid').style.width=Math.min(100,paid/expTotal*100).toFixed(1)+'%';
  document.getElementById('d-epb-paid-val').textContent=fmt(paid);
  document.getElementById('d-epb-pend').style.width=Math.min(100,pend/expTotal*100).toFixed(1)+'%';
  document.getElementById('d-epb-pend-val').textContent=fmt(pend);
  document.getElementById('d-exp-prog-pct').textContent=Math.round(paid/expTotal*100)+'% paid';
  // Per-week mini bars
  document.getElementById('d-week-prog-list').innerHTML=cw().map((w,wi)=>{
    const wt=w.items.reduce((s,i)=>s+i.amount,0);
    const wp=w.items.filter(i=>i.paid).reduce((s,i)=>s+i.amount,0);
    const wpct=wt>0?Math.min(100,wp/wt*100):0;
    const allPaid=wt>0&&wp===wt;
    return`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
      <span style="font-size:10px;color:var(--text-muted);min-width:28px;">Wk ${wi+1}</span>
      <div style="flex:1;height:5px;background:var(--slate-mid);border-radius:3px;overflow:hidden;">
        <div style="height:100%;border-radius:3px;background:${allPaid?'var(--success)':'var(--sage)'};width:${wpct.toFixed(1)}%;transition:width .5s;"></div>
      </div>
      <span style="font-size:10px;font-family:'DM Mono',monospace;color:${allPaid?'var(--success)':'var(--text-muted)'};min-width:32px;text-align:right;">${wpct.toFixed(0)}%</span>
    </div>`;
  }).join('');

  // ── LOAN PAYOFF PROGRESS ──
  const loanTotal=debt||1;
  document.getElementById('d-loan-summary').textContent=S.loans.length+' loans · '+fmt(debt)+' remaining';
  document.getElementById('loanProgressList').innerHTML=S.loans.length?S.loans.map(l=>{
    const oa=l.originalAmount||l.amount;
    const pct=Math.min(100,Math.max(2,oa>0?(oa-l.amount)/oa*100:0));
    const col=l.rate>15?'var(--danger)':l.rate>10?'var(--amber)':'var(--sage)';
    const isPaidOff=l.amount<=0;
    return`<div class="prog-item-dash">
      <div class="prog-header">
        <span class="pn" style="${isPaidOff?'text-decoration:line-through;color:var(--success);':''}">${l.name}</span>
        <span class="pa">${isPaidOff?'Paid off!':fmt(amt(l.amount))}</span>
      </div>
      <div class="prog-track"><div class="prog-fill-dash" style="width:${pct.toFixed(1)}%;background:${col};"></div></div>
      <div class="prog-foot">${l.rate}% APR &nbsp;·&nbsp; ${pct.toFixed(0)}% paid off ${isPaidOff?'🏆':''}</div>
    </div>`;
  }).join(''):'<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">No loans added yet.</div>';

  // ── SAVINGS GOALS ──
  const savGoalsList=S.savings||[];
  document.getElementById('d-sav-summary').textContent=savGoalsList.length+' goals · '+fmt(sv)+' saved';
  renderDashSavings(savGoalsList);

  // ── NET WORTH ──
  const nw=sv-debt;
  const nwEl=document.getElementById('d-networth');
  if(nwEl){
    nwEl.textContent=(nw<0?'-':'')+fmt(Math.abs(nw));
    nwEl.className='dkv '+(nw>=0?'nw-pos':'nw-neg');
    const nwSub=document.getElementById('d-nw-sub');
    if(nwSub){nwSub.textContent=fmt(sv)+' savings − '+fmt(debt)+' debt';}
  }

  // Award XP for positive historical months (once per month per session)
  if(net>0){
    const xpKey='fintone_xp_pos_'+CMK;
    if(!sessionStorage.getItem(xpKey)){
      if(typeof awardXP==='function') awardXP('positive_month');
      sessionStorage.setItem(xpKey,'1');
    }
  }

  // Gamification — streak, challenge, achievements, XP bar, heatmap
  if(typeof renderGamification==='function') renderGamification();
}

function renderExpSumChart(){
  dc('es');CH['es']=new Chart(document.getElementById('expSumChart'),{type:'bar',data:{labels:['Wk 1','Wk 2','Wk 3','Wk 4','Revenue'],datasets:[{data:[...cw().map(w=>w.items.reduce((s,i)=>s+i.amount,0)),totalRev()],backgroundColor:['#5C7A6B','#5C7A6B','#5C7A6B','#5C7A6B','#B8860B'],borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{ticks:{callback:v=>fmtK(v),font:{size:9}}}}}});
}
function renderIncomeChart(){
  dc('ic');const keys=Object.keys(S.months).slice(-8);
  CH['ic']=new Chart(document.getElementById('incomeChart'),{type:'line',data:{labels:keys,datasets:[{label:'Income',data:keys.map(k=>totalRev(k)),borderColor:'#276749',backgroundColor:'rgba(39,103,73,.08)',borderWidth:2,pointRadius:3,fill:true,tension:.3},{label:'Expenses',data:keys.map(k=>totalExp(k)),borderColor:'#C53030',backgroundColor:'rgba(197,48,48,.05)',borderWidth:2,pointRadius:3,fill:true,tension:.3}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{font:{size:10},padding:8,boxWidth:10}}},scales:{x:{grid:{display:false},ticks:{font:{size:9}}},y:{ticks:{callback:v=>fmtK(v),font:{size:9}}}}}});
}
function renderCatTrend(keys){
  dc('ct');const cats=Object.keys(CAT_LABELS);
  const dsets=cats.map(cat=>{const lbl=CAT_LABELS[cat];const data=keys.map(k=>S.months[k].weeks.reduce((s,w)=>s+w.items.filter(i=>getCat(i.name)===cat).reduce((a,i)=>a+i.amount,0),0));if(data.every(v=>v===0))return null;return{label:lbl,data,borderColor:CAT_COLORS[lbl]||'#A0AEC0',backgroundColor:'transparent',borderWidth:2,pointRadius:2,tension:.3};}).filter(Boolean);
  CH['ct']=new Chart(document.getElementById('catTrendChart'),{type:'line',data:{labels:keys,datasets:dsets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{font:{size:9},padding:6,boxWidth:9}}},scales:{x:{grid:{display:false},ticks:{font:{size:9}}},y:{ticks:{callback:v=>fmtK(v),font:{size:9}}}}}});
}
function renderNetChart(keys,nets){
  dc('nc');CH['nc']=new Chart(document.getElementById('netChart'),{type:'line',data:{labels:keys,datasets:[{label:'Net Flow',data:nets,borderColor:'#276749',backgroundColor:'rgba(39,103,73,.1)',borderWidth:2,pointRadius:3,fill:true,tension:.3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{size:9}}},y:{ticks:{callback:v=>fmtK(v),font:{size:9}},grid:{color:'rgba(0,0,0,0.03)'}}}}});
}
