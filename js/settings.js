// === settings.js ===

// ── AI provider key management ──
var _CLAUDE_KEY='finflow_claude_key';
var _OPENAI_KEY='finflow_openai_key';
var _AI_PREF='finflow_ai_provider';
var _setupTab='claude'; // which tab is active in setup modal
var _removeTarget=''; // which provider is being removed

function getClaudeKey(){try{var k=localStorage.getItem(_CLAUDE_KEY);return k?atob(k):null;}catch(e){return null;}}
function getOpenAIKey(){try{var k=localStorage.getItem(_OPENAI_KEY);return k?atob(k):null;}catch(e){return null;}}
function _saveClaudeKey(k){try{localStorage.setItem(_CLAUDE_KEY,btoa(k));}catch(e){}}
function _saveOpenAIKey(k){try{localStorage.setItem(_OPENAI_KEY,btoa(k));}catch(e){}}
function _deleteClaudeKey(){localStorage.removeItem(_CLAUDE_KEY);}
function _deleteOpenAIKey(){localStorage.removeItem(_OPENAI_KEY);}

function getActiveProvider(){
  var hc=!!getClaudeKey();var ho=!!getOpenAIKey();
  if(!hc&&!ho)return null;
  if(hc&&!ho)return 'claude';
  if(!hc&&ho)return 'openai';
  return localStorage.getItem(_AI_PREF)||'claude';
}
function setAIProvider(p){localStorage.setItem(_AI_PREF,p);updateAIBtn();}

function updateAIBtn(){
  var btn=document.getElementById('aiInsightBtn');
  var mgr=document.getElementById('aiManageBtn');
  if(!btn)return;
  var p=getActiveProvider();
  if(p==='claude'){
    btn.innerHTML='&#129302; Ask Claude';
    btn.style.color='var(--sage)';btn.style.borderColor='var(--sage-mid)';
  }else if(p==='openai'){
    btn.innerHTML='&#9889; Ask GPT-4o';
    btn.style.color='var(--blue)';btn.style.borderColor='var(--blue-mid)';
  }else{
    btn.innerHTML='&#128279; Connect AI';
    btn.style.color='var(--text-secondary)';btn.style.borderColor='var(--border)';
  }
  if(mgr)mgr.style.display=p?'':'none';
  updateAIActionGrid();
}
// legacy alias
function updateClaudeBtn(){updateAIBtn();}

function switchSetupTab(tab){
  _setupTab=tab;
  var isC=(tab==='claude');
  document.getElementById('setupPanelClaude').style.display=isC?'':'none';
  document.getElementById('setupPanelOpenai').style.display=isC?'none':'';
  document.getElementById('setupTabClaude').className='ai-tab-btn'+(isC?' ai-tab-active':'');
  document.getElementById('setupTabOpenai').className='ai-tab-btn'+(isC?'':' ai-tab-active');
  var e=document.getElementById('claudeSetupError');e.style.display='none';e.textContent='';
}

function openClaudeSetup(){openAISetup('claude');}
function openAISetup(tab){
  _setupTab=tab||'claude';
  document.getElementById('claudeSetupModal').style.display='flex';
  document.getElementById('claudeKeyInput').value='';
  document.getElementById('openaiKeyInput').value='';
  var e=document.getElementById('claudeSetupError');e.style.display='none';e.textContent='';
  var cb=document.getElementById('claudeConnectBtn');cb.disabled=false;cb.textContent='Connect';
  document.getElementById('claudeKeyInput').type='password';document.getElementById('claudeKeyToggle').textContent='Show';
  document.getElementById('openaiKeyInput').type='password';document.getElementById('openaiKeyToggle').textContent='Show';
  switchSetupTab(_setupTab);
}
function closeClaudeSetup(){document.getElementById('claudeSetupModal').style.display='none';}

function toggleClaudeKeyVis(){
  var i=document.getElementById('claudeKeyInput');var b=document.getElementById('claudeKeyToggle');
  if(i.type==='password'){i.type='text';b.textContent='Hide';}else{i.type='password';b.textContent='Show';}
}
function toggleOpenAIKeyVis(){
  var i=document.getElementById('openaiKeyInput');var b=document.getElementById('openaiKeyToggle');
  if(i.type==='password'){i.type='text';b.textContent='Hide';}else{i.type='password';b.textContent='Show';}
}

async function connectAI(){
  var isClaude=(_setupTab==='claude');
  var key=isClaude?document.getElementById('claudeKeyInput').value.trim():document.getElementById('openaiKeyInput').value.trim();
  var errEl=document.getElementById('claudeSetupError');
  var btn=document.getElementById('claudeConnectBtn');
  errEl.style.display='none';
  if(!key){errEl.textContent='Please enter your API key.';errEl.style.display='block';return;}
  if(isClaude&&!key.startsWith('sk-ant-')){errEl.textContent="Anthropic keys start with sk-ant-";errEl.style.display='block';return;}
  if(!isClaude&&!key.startsWith('sk-')){errEl.textContent="OpenAI keys start with sk-";errEl.style.display='block';return;}
  btn.disabled=true;btn.textContent='Validating…';
  try{
    var resp;
    if(isClaude){
      resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1,messages:[{role:'user',content:'hi'}]})});
    }else{
      resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
        body:JSON.stringify({model:'gpt-4o-mini',max_tokens:1,messages:[{role:'user',content:'hi'}]})});
    }
    if(resp.status===401){errEl.textContent='Invalid API key — check it and try again.';errEl.style.display='block';btn.disabled=false;btn.textContent='Connect';return;}
    if(isClaude){_saveClaudeKey(key);}else{_saveOpenAIKey(key);}
    closeClaudeSetup();
    updateAIBtn();
    showToast((isClaude?'Claude':'GPT-4o')+' connected ✓');
    runAiInsights();
  }catch(e){
    errEl.textContent='Network error — check your connection and try again.';errEl.style.display='block';
    btn.disabled=false;btn.textContent='Connect';
  }
}
// legacy alias
function connectClaude(){connectAI();}

function openClaudeManage(){
  var hc=!!getClaudeKey();var ho=!!getOpenAIKey();
  if(!hc&&!ho){openAISetup('claude');return;}
  // Build Claude row actions
  var ca=document.getElementById('mgr-claude-actions');
  var cs=document.getElementById('mgr-claude-status');
  if(hc){
    cs.textContent='● Connected (sk-ant-…'+getClaudeKey().slice(-4)+')';cs.className='ai-provider-status connected';
    ca.innerHTML='<button class="tbtn" style="font-size:11px;" onclick="claudeUpdateKey()">&#9998; Update</button><button class="tbtn" style="font-size:11px;color:var(--danger);border-color:var(--danger-mid);" onclick="aiRemoveKey(\'claude\')">&#128465;</button>';
  }else{
    cs.textContent='Not connected';cs.className='ai-provider-status disconnected';
    ca.innerHTML='<button class="tbtn" style="font-size:11px;color:var(--sage);border-color:var(--sage-mid);" onclick="openAISetup(\'claude\')">Connect</button>';
  }
  // Build OpenAI row actions
  var oa=document.getElementById('mgr-openai-actions');
  var os=document.getElementById('mgr-openai-status');
  if(ho){
    os.textContent='● Connected (sk-…'+getOpenAIKey().slice(-4)+')';os.className='ai-provider-status connected';
    oa.innerHTML='<button class="tbtn" style="font-size:11px;" onclick="openaiUpdateKey()">&#9998; Update</button><button class="tbtn" style="font-size:11px;color:var(--danger);border-color:var(--danger-mid);" onclick="aiRemoveKey(\'openai\')">&#128465;</button>';
  }else{
    os.textContent='Not connected';os.className='ai-provider-status disconnected';
    oa.innerHTML='<button class="tbtn" style="font-size:11px;color:var(--blue);border-color:var(--blue-mid);" onclick="openAISetup(\'openai\')">Connect</button>';
  }
  // Default row
  var dr=document.getElementById('aiDefaultRow');
  if(hc&&ho){
    dr.style.display='flex';
    document.getElementById('aiProviderSelect').value=getActiveProvider();
  }else{dr.style.display='none';}
  document.getElementById('claudeRemoveConfirm').style.display='none';
  document.getElementById('claudeManageModal').style.display='flex';
}
function closeClaudeManage(){document.getElementById('claudeManageModal').style.display='none';}
function claudeUpdateKey(){closeClaudeManage();openAISetup('claude');}
function openaiUpdateKey(){closeClaudeManage();openAISetup('openai');}
function aiRemoveKey(provider){
  _removeTarget=provider;
  document.getElementById('claudeRemoveMsg').textContent='Remove '+(provider==='claude'?'Claude':'OpenAI')+' key? Insights via this provider will stop until you reconnect.';
  document.getElementById('claudeRemoveConfirm').style.display='block';
}
function claudeRemoveKey(){aiRemoveKey('claude');}
function claudeConfirmRemove(){
  if(_removeTarget==='claude'){_deleteClaudeKey();}else{_deleteOpenAIKey();}
  document.getElementById('claudeRemoveConfirm').style.display='none';
  var stillHas=!!getClaudeKey()||!!getOpenAIKey();
  if(stillHas){openClaudeManage();}else{closeClaudeManage();}
  updateAIBtn();
  showToast((_removeTarget==='claude'?'Claude':'GPT-4o')+' disconnected');
  _removeTarget='';
}

async function runAiInsights(){
  var provider=getActiveProvider();
  if(!provider){openAISetup('claude');return;}
  updateAIActionGrid();
  await runInsightMode('general');
}

// ── Smart Insights: action grid, shortfall banner, shared callAI ──

function updateAIActionGrid(){
  var grid=document.getElementById('aiActionGrid');
  if(!grid)return;
  grid.style.display=getActiveProvider()?'':'none';
}

function renderShortfallBanner(){
  var el=document.getElementById('aiShortfallBanner');
  if(!el)return;
  var income=totalRev();
  var expenses=totalExp();
  if(income<=0&&expenses<=0){el.style.display='none';return;}
  var net=income-expenses;
  var unpaid=cm().weeks.reduce(function(s,w){return s+w.items.filter(function(i){return!i.paid;}).reduce(function(a,i){return a+amt(i.amount);},0);},0);
  var parts=[];
  if(net<0){
    parts.push('<div class="ai-shortfall-warn">&#9888;&#65039; <strong>Spending shortfall this month:</strong> Expenses ('+fmt(expenses)+') exceed income ('+fmt(income)+') by <strong>'+fmt(Math.abs(net))+'</strong>. You need '+fmt(Math.abs(net))+' more to balance this month.</div>');
  }else if(income>0&&net/income<0.10){
    parts.push('<div class="ai-shortfall-tight">&#128155; <strong>Tight month:</strong> Only '+fmt(net)+' ('+Math.round(net/income*100)+'%) buffer left after expenses of '+fmt(expenses)+'.</div>');
  }
  if(unpaid>0&&net>=0){
    var afterUnpaid=net-unpaid;
    if(afterUnpaid<0){
      parts.push('<div class="ai-shortfall-warn"'+(parts.length?' style="margin-top:6px;"':'')+'>&#9200; <strong>Unpaid bills alert:</strong> '+fmt(unpaid)+' pending would leave a <strong>'+fmt(Math.abs(afterUnpaid))+'</strong> shortfall — need '+fmt(Math.abs(afterUnpaid))+' more to clear all bills.</div>');
    }else if(parts.length===0){
      parts.push('<div class="ai-shortfall-tight">&#9200; <strong>'+fmt(unpaid)+'</strong> in unpaid bills this month — buffer after clearing all: '+fmt(afterUnpaid)+'.</div>');
    }
  }
  el.innerHTML=parts.join('');
  el.style.display=parts.length?'':'none';
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

async function callAI(prompt,label){
  var provider=getActiveProvider();
  if(!provider){openAISetup('claude');return null;}
  var isClaude=(provider==='claude');
  var key=isClaude?getClaudeKey():getOpenAIKey();
  if(!key){openAISetup(provider);return null;}
  var providerLabel=isClaude?'Claude AI':'GPT-4o';
  var providerIcon=isClaude?'&#129302;':'&#9889;';
  var card=document.getElementById('aiInsightCard');
  card.style.display='block';
  card.innerHTML='<div class="ai-insight-header"><span style="font-size:16px;">'+providerIcon+'</span><span class="ai-badge">'+providerLabel+'</span><span style="font-size:12px;color:var(--text-secondary);margin-left:auto;">'+(label||'Analysing…')+'</span></div><div class="ai-loading"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div></div>';
  try{
    var resp;
    if(isClaude){
      resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,messages:[{role:'user',content:prompt}]})});
    }else{
      resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
        body:JSON.stringify({model:'gpt-4o',max_tokens:1000,messages:[{role:'user',content:prompt}]})});
    }
    if(!resp.ok){
      var ed=await resp.json().catch(function(){return{};});
      var em=(ed.error&&ed.error.message)||('Error '+resp.status);
      if(resp.status===401)em='API key invalid or expired. <a href="#" onclick="openClaudeManage();return false;" style="color:var(--sage);">Update key &#8594;</a>';
      if(resp.status===429)em='Rate limit reached — wait a moment and try again.';
      card.innerHTML='<div class="ai-insight-header"><span style="font-size:16px;">'+providerIcon+'</span><span class="ai-badge">'+providerLabel+'</span></div><div style="font-size:12px;color:var(--danger);padding-top:6px;">'+em+'</div>';
      return null;
    }
    var data=await resp.json();
    var text;
    if(isClaude){
      var _f=data.content&&data.content.find(function(c){return c.type==='text';});
      text=(_f&&_f.text)||'No response received.';
    }else{
      text=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'No response received.';
    }
    return{text:text,providerIcon:providerIcon,providerLabel:providerLabel};
  }catch(e){
    card.innerHTML='<div class="ai-insight-header"><span style="font-size:16px;">'+providerIcon+'</span><span class="ai-badge">'+providerLabel+'</span></div><div style="font-size:12px;color:var(--danger);padding-top:6px;">Network error — check your connection and try again.</div>';
    return null;
  }
}

function _getModeLabel(mode){
  return{general:'General Insights',debt:'Debt Optimizer',anomaly:'Spending Anomalies',budget:'Budget Recommender',summary:'Monthly Summary',forecast:'Cash Flow Forecast',qa:'Your Question'}[mode]||mode;
}

async function runInsightMode(mode){
  document.querySelectorAll('.ai-mode-btn').forEach(function(b){b.classList.remove('ai-active');});
  var ab=document.getElementById('modeBtn-'+mode);
  if(ab)ab.classList.add('ai-active');
  var ctx=_buildFinancialContext(6);
  var ctxStr=JSON.stringify(ctx,null,2);
  var prompt,label;
  if(mode==='general'){
    label='Analysing your finances…';
    prompt='You are a friendly personal finance advisor. Based on the financial data below, provide 3-4 concise, actionable insights in plain English. Be specific with numbers and amounts. Be encouraging but honest. Format as short paragraphs, no bullet points, no markdown headers.\n\nData:\n'+ctxStr;
  }else if(mode==='debt'){
    label='Optimising debt payoff strategy…';
    prompt='You are a debt payoff advisor. Review the loans below and recommend either the avalanche (highest rate first) or snowball (lowest balance first) method — explain why this fits this situation. Name each loan, give the payoff order, and estimate interest saved. Be concrete and specific with numbers.\n\nData:\n'+ctxStr;
  }else if(mode==='anomaly'){
    label='Scanning for spending anomalies…';
    prompt='You are a spending analyst. Review the monthly spending by category over the last 6 months. Identify: categories with unusual spikes, months that look significantly different from the trend, and any consistently over-budget areas. Be specific about months and dollar amounts. Use plain English, no markdown headers.\n\nData:\n'+ctxStr;
  }else if(mode==='budget'){
    label='Building budget recommendations…';
    prompt='You are a budget planner. Based on the income level and actual spending patterns, recommend specific monthly budget amounts for each category. Use the 50/30/20 guideline as a reference. State each category and its recommended amount. Explain your reasoning briefly. Use plain English.\n\nData:\n'+ctxStr;
  }else if(mode==='summary'){
    label='Summarising this month…';
    prompt='You are a personal finance summariser. Write a concise summary of the current month financial situation: income vs expenses, how it compares to recent months, top spending categories, and one specific actionable recommendation. Keep it to 3 short paragraphs, plain English.\n\nData:\n'+ctxStr;
  }else if(mode==='forecast'){
    label='Forecasting cash flow next 3 months…';
    prompt='You are a cash flow forecaster. Based on income and expense trends in the data, project what the next 3 months might look like financially. Identify which months look risky and why. Give one concrete recommendation to improve cash position. Use specific estimated numbers.\n\nData:\n'+ctxStr;
  }else if(mode==='qa'){
    var q=(document.getElementById('aiQuestion').value||'').trim();
    if(!q){showToast('Type a question first');return;}
    label='Answering your question…';
    prompt='You are a personal finance advisor. The user asks: "'+q+'"\n\nAnswer based on their actual financial data below. Be specific, concise, and actionable. Refer to their real numbers where relevant.\n\nData:\n'+ctxStr;
  }else{return;}
  var result=await callAI(prompt,label);
  if(!result)return;
  var card=document.getElementById('aiInsightCard');
  card.innerHTML='<div class="ai-insight-header"><span style="font-size:16px;">'+result.providerIcon+'</span><span class="ai-badge">'+result.providerLabel+'</span><span style="font-size:11px;color:var(--text-muted);margin-left:auto;">'+_getModeLabel(mode)+'</span></div><div class="ai-insight-body">'+result.text.replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</div>';
}

// ══════════════════════════════════════════════════════
// RESET FUNCTIONALITY
// ══════════════════════════════════════════════════════
let _resetTarget = ''; // 'expenses' | 'revenue' | 'loans' | 'savings'

const RESET_CONFIG = {
  expenses: {
    title: (m) => `Reset All Expenses for ${m}?`,
    desc: 'This will permanently delete ALL expense items across all 4 weeks for this month. Amounts, due dates, and paid status will all be removed.',
    word: 'RESET',
    icon: '🗑️',
    execute: () => {
      cm().weeks = [{items:[]},{items:[]},{items:[]},{items:[]}];
      persist(); renderExpenses(); updateHealth();
    }
  },
  revenue: {
    title: (m) => `Reset All Revenue for ${m}?`,
    desc: 'This will permanently delete ALL income sources for this month. All amounts and received status will be removed.',
    word: 'RESET',
    icon: '🗑️',
    execute: () => {
      cm().revenue = [];
      persist(); renderRevenue(); updateHealth();
    }
  },
  loans: {
    title: (m) => `Reset All Loan Payments for ${m}?`,
    desc: 'This will permanently delete ALL loan payment history chips across all loans. The loans themselves and their balances are not affected — only the monthly payment records.',
    word: 'RESET',
    icon: '🗑️',
    execute: () => {
      S.loans.forEach(l => {
        l.payments = l.payments.filter(p => p.month !== CMK);
      });
      persist(); renderLoans(); updateHealth();
    }
  },
  savings: {
    title: (m) => `Reset All Savings for ${m}?`,
    desc: 'This will permanently delete ALL savings goals — including balances, contribution settings, and interest rates. This cannot be undone.',
    word: 'DELETE ALL',
    icon: '⚠️',
    execute: () => {
      S.savings = [];
      persist(); renderSavings(); updateHealth();
    }
  }
};

function openResetModal(target) {
  _resetTarget = target;
  const cfg = RESET_CONFIG[target];
  document.getElementById('resetModalTitle').textContent = cfg.title(CMK);
  document.getElementById('resetModalDesc').textContent = cfg.desc;
  document.getElementById('resetConfirmWord').textContent = cfg.word;
  document.getElementById('resetConfirmInput').value = '';
  const btn = document.getElementById('resetConfirmBtn');
  btn.disabled = true;
  btn.classList.add('btn-d-disabled');
  document.getElementById('resetModal').classList.add('open');
  trapFocus(document.getElementById('resetModal'));
  setTimeout(()=>{ const f=document.getElementById('resetConfirmInput'); if(f)f.focus(); },120);
  setTimeout(() => document.getElementById('resetConfirmInput').focus(), 100);
}
function closeResetModal() {
  releaseTrap(document.getElementById('resetModal'));
  document.getElementById('resetModal').classList.remove('open');
  _resetTarget = '';
}
function checkResetConfirm(val) {
  const cfg = RESET_CONFIG[_resetTarget];
  if (!cfg) return;
  const btn = document.getElementById('resetConfirmBtn');
  const ok = val.trim().toUpperCase() === cfg.word;
  btn.disabled = !ok;
  btn.classList.toggle('btn-d-disabled', !ok);
}
function executeReset() {
  const cfg = RESET_CONFIG[_resetTarget];
  if (!cfg) return;
  cfg.execute();
  closeResetModal();
  showToast(`✓ ${_resetTarget.charAt(0).toUpperCase()+_resetTarget.slice(1)} reset for ${CMK}`);
}

// ══════════════════════════════════════════════
// MULTI-CURRENCY & EXCHANGE RATES
// Uses open.er-api.com (free, no key required)
// Rates cached 24h in S.fxRates
// ══════════════════════════════════════════════
const CURRENCY_MAP={
  CAD:{symbol:'$',locale:'en-CA'},USD:{symbol:'$',locale:'en-US'},
  GBP:{symbol:'£',locale:'en-GB'},EUR:{symbol:'€',locale:'de-DE'},
  AUD:{symbol:'$',locale:'en-AU'},NZD:{symbol:'$',locale:'en-NZ'},
  CHF:{symbol:'CHF ',locale:'de-CH'},JPY:{symbol:'¥',locale:'ja-JP'},
  INR:{symbol:'₹',locale:'hi-IN'},MXN:{symbol:'$',locale:'es-MX'},
  ZAR:{symbol:'R',locale:'en-ZA'},NGN:{symbol:'₦',locale:'en-NG'},
  KES:{symbol:'KSh',locale:'sw-KE'},GHS:{symbol:'₵',locale:'en-GH'}
};

async function fetchFXRates(base){
  showToast('Fetching exchange rates…');
  const now=Date.now();
  if(S.fxRates&&S.fxRates.base===base&&now-S.fxRates.fetchedAt<86400000){
    return S.fxRates.rates; // cached
  }
  try{
    const r=await fetch('https://open.er-api.com/v6/latest/'+base);
    const data=await r.json();
    if(data.result==='success'){
      S.fxRates={rates:data.rates,fetchedAt:now,base};
      persist(false);
      return data.rates;
    }
  }catch(e){}
  return (S.fxRates&&S.fxRates.rates)||{};
}

function convertAmount(amount,fromCode,toCode,rates){
  if(!fromCode||fromCode===toCode||!rates)return amount;
  const fromRate=rates[fromCode]||1;
  const toRate=rates[toCode]||1;
  return amount*(toRate/fromRate);
}

function fmtFX(amount,itemCurrency){
  // If item has a different currency, show original + converted
  const cur=getCurrency();
  const base=cur.code;
  if(!itemCurrency||itemCurrency===base)return fmt(amount);
  const rates=(S.fxRates&&S.fxRates.rates)||{};
  const converted=convertAmount(amount,itemCurrency,base,rates);
  const origSym=(CURRENCY_MAP[itemCurrency]&&CURRENCY_MAP[itemCurrency].symbol)||itemCurrency+' ';
  return origSym+Math.abs(amount).toLocaleString(cur.locale,{minimumFractionDigits:2,maximumFractionDigits:2})+
         ' <span style="font-size:9px;color:var(--text-muted);">('+fmt(converted)+')</span>';
}


// ══════════════════════════════════════════════
// PUSH NOTIFICATION REMINDERS
// Uses Web Notifications API to remind 2 days before bill due date
// ══════════════════════════════════════════════
let _notifEnabled=false;

async function toggleNotifications(){
  if(!('Notification' in window)){showToast('Notifications not supported in this browser','warn-t');return;}
  if(Notification.permission==='granted'){
    _notifEnabled=!_notifEnabled;
    updateNotifBtn();
    if(_notifEnabled){scheduleBillReminders();showToast('✓ Bill reminders enabled');}
    else showToast('Bill reminders disabled');
    return;
  }
  if(Notification.permission==='denied'){showToast('Notifications blocked — check browser settings','warn-t');return;}
  const perm=await Notification.requestPermission();
  if(perm==='granted'){
    _notifEnabled=true;
    updateNotifBtn();
    scheduleBillReminders();
    showToast('✓ Bill reminders enabled');
  }
}

function updateNotifBtn(){
  const btn=document.getElementById('notifBtn');
  if(!btn)return;
  btn.innerHTML=_notifEnabled?'🔔':'🔕';
  btn.title=_notifEnabled?'Bill reminders ON — click to disable':'Bill reminders OFF — click to enable';
}

function scheduleBillReminders(){
  if(!_notifEnabled||Notification.permission!=='granted')return;
  // Find bills due in the next 3 days
  const parts=CMK.split(' ');const mo=MS.indexOf(parts[0]);const yr=parseInt(parts[1]);
  const today=new Date();const todayDate=today.getDate();
  const bills=[];
  cw().forEach(w=>w.items.forEach(item=>{
    if(item.dueDay&&!item.paid){
      const daysUntil=item.dueDay-todayDate;
      if(daysUntil>=0&&daysUntil<=3){bills.push({name:item.name,amount:item.amount,dueDay:item.dueDay,daysUntil});}
    }
  }));
  if(!bills.length)return;
  // Show immediate notification for bills due in 0-3 days
  bills.forEach(b=>{
    const msg=b.daysUntil===0?'Due TODAY':b.daysUntil===1?'Due TOMORROW':'Due in '+b.daysUntil+' days';
    setTimeout(()=>{
      try{
        new Notification('FinFlow — Bill Reminder',{
          body:b.name+' ('+fmt(b.amount)+') — '+msg,
          icon:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%235C7A6B"/><text y="70" font-size="60" text-anchor="middle" x="50" fill="white">$</text></svg>',
          tag:'finflow-'+b.name
        });
      }catch(e){}
    },500+bills.indexOf(b)*800); // stagger notifications
  });
  showToast('📅 Sent '+bills.length+' bill reminder'+(bills.length>1?'s':''));
}

// Check reminders on bill calendar render
function checkAndRemind(){
  if(_notifEnabled&&Notification.permission==='granted')scheduleBillReminders();
}

function openCurrencyModal(){
  const sel=document.getElementById('currencySelect');
  const cur=S.currency||{symbol:'$',code:'CAD',locale:'en-CA'};
  sel.value=cur.code||'CAD';
  if(!CURRENCY_MAP[sel.value])sel.value='CUSTOM';
  document.getElementById('customSymbol').value=cur.symbol;
  document.getElementById('customLocale').value=cur.locale;
  document.getElementById('customCurrRow').style.display=sel.value==='CUSTOM'?'block':'none';
  updateCurrencyPreview(sel.value);
  document.getElementById('currencyModal').classList.add('open');
  trapFocus(document.getElementById('currencyModal'));
  setTimeout(()=>{const _f=document.querySelector('#currencyModal select');if(_f)_f.focus();},120);
}
function closeCurrencyModal(){releaseTrap(document.getElementById('currencyModal'));
  document.getElementById('currencyModal').classList.remove('open');}
function updateCurrencyPreview(code){
  document.getElementById('customCurrRow').style.display=code==='CUSTOM'?'block':'none';
  const sym=code==='CUSTOM'?document.getElementById('customSymbol').value:(CURRENCY_MAP[code]&&CURRENCY_MAP[code].symbol)||'$';
  const loc=code==='CUSTOM'?document.getElementById('customLocale').value:(CURRENCY_MAP[code]&&CURRENCY_MAP[code].locale)||'en-CA';
  try{document.getElementById('currPreview').textContent=sym+(1234.56).toLocaleString(loc,{minimumFractionDigits:2,maximumFractionDigits:2});}
  catch(e){document.getElementById('currPreview').textContent=sym+'1,234.56';}
}
function saveCurrency(){
  const code=document.getElementById('currencySelect').value;
  let sym,loc;
  if(code==='CUSTOM'){sym=document.getElementById('customSymbol').value||'$';loc=document.getElementById('customLocale').value||'en-CA';}
  else{sym=(CURRENCY_MAP[code]&&CURRENCY_MAP[code].symbol)||'$';loc=(CURRENCY_MAP[code]&&CURRENCY_MAP[code].locale)||'en-CA';}
  S.currency={symbol:sym,code,locale:loc};
  persist();
  fetchFXRates(code).then(()=>{
    const _as2=document.querySelector('.section.active');const tab2=_as2?_as2.id.replace('section-',''):'dashboard';
    renderSection(tab2);
  });
  closeCurrencyModal();showToast('✓ Currency updated to '+code);
}

// ══════════════════════════════════════════════
// SETTINGS MODAL
// ══════════════════════════════════════════════
function openSettings(){
  document.getElementById('settingsModal').classList.add('open');
  trapFocus(document.getElementById('settingsModal'));
}
function closeSettings(){
  releaseTrap(document.getElementById('settingsModal'));
  document.getElementById('settingsModal').classList.remove('open');
}

// ══════════════════════════════════════════════
// RESET / DANGER ZONE
// ══════════════════════════════════════════════
function openResetConfirm(){
  const inp=document.getElementById('fullResetInput');
  const btn=document.getElementById('fullResetBtn');
  inp.value='';
  inp.classList.remove('matched');
  btn.disabled=true;
  btn.style.opacity='.35';
  btn.style.cursor='not-allowed';
  closeSettings();
  document.getElementById('fullResetModal').classList.add('open');
  trapFocus(document.getElementById('fullResetModal'));
  setTimeout(()=>inp.focus(),120);
}
function closeFullResetConfirm(){
  releaseTrap(document.getElementById('fullResetModal'));
  document.getElementById('fullResetModal').classList.remove('open');
}
function checkResetWord(){
  const val=document.getElementById('fullResetInput').value;
  const btn=document.getElementById('fullResetBtn');
  const ok=val.trim().toUpperCase()==='RESET';
  btn.disabled=!ok;
  btn.style.opacity=ok?'1':'.35';
  btn.style.cursor=ok?'pointer':'not-allowed';
  document.getElementById('fullResetInput').classList.toggle('matched',ok);
}
async function executeFullReset(){
  closeFullResetConfirm();
  await resetAllData();
}
function confirmDemoReset(){
  if(!confirm('Clear all demo data and start fresh?\n\nYou\'ll go through the setup wizard again.')) return;
  resetAllData();
}

function checkDemoBanner(){
  if(!localStorage.getItem('finflow_onboarded')){
    document.getElementById('demoBanner').style.display='flex';
  }
}

function exportData(){
  const json=JSON.stringify(S,null,2);
  const filename='finflow-'+new Date().toISOString().slice(0,10)+'.json';
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[new File([json],'x.json',{type:'application/json'})]})){
    const file=new File([json],filename,{type:'application/json'});
    navigator.share({files:[file],title:'FinFlow Backup'}).catch(()=>downloadExport(json,filename));
  } else { downloadExport(json,filename); }
}
function downloadExport(json,filename){
  const b=new Blob([json],{type:'application/json'});
  const url=URL.createObjectURL(b);
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),100);
  showToast('✓ Backup downloaded');
}
