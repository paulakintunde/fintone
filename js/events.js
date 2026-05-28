// js/events.js — Centralised event delegation
// Replaces all inline onclick/onchange/oninput/onkeydown handlers in index.html.
// Add data-* attributes to elements; this file dispatches to the right function.

// ════════════════════════════════════════════════
// WRAPPER FUNCTIONS — multi-call & special cases
// ════════════════════════════════════════════════

// Mobile action-sheet wrappers
function notifAndCloseMenu(){toggleNotifications();toggleMobileMenu();}
function currencyAndCloseMenu(){openCurrencyModal();toggleMobileMenu();}
function compareAndCloseMenu(){openCompareModal();toggleMobileMenu();}
function exportAndCloseMenu(){exportData();toggleMobileMenu();}
function importAndCloseMenu(){openImport();toggleMobileMenu();}
function printAndCloseMenu(){window.print();toggleMobileMenu();}
function settingsAndCloseMenu(){openSettings();toggleMobileMenu();}

// Settings modal wrappers
function exportFromSettings(){exportData();closeSettings();}
function exportCSVFromSettings(){exportCSV();closeSettings();}
function importFromSettings(){openImport();closeSettings();}
function currencyFromSettings(){openCurrencyModal();closeSettings();}
function compareFromSettings(){openCompareModal();closeSettings();}
function resetExpensesFromSettings(){closeSettings();openResetModal('expenses');}
function resetRevenueFromSettings(){closeSettings();openResetModal('revenue');}
function resetLoansFromSettings(){closeSettings();openResetModal('loans');}
function resetSavingsFromSettings(){closeSettings();openResetModal('savings');}

// Banner / confirm panel helpers
function dismissDemoBanner(){var b=document.getElementById('demoBanner');if(b)b.style.display='none';}
function hideclaudeRemoveConfirm(){var el=document.getElementById('claudeRemoveConfirm');if(el)el.style.display='none';}

// AI insight wrappers
function runInsightModeQa(){if(typeof runInsightMode==='function')runInsightMode('qa');}

// Switch-to-specific-tab wrappers
function switchToExpensesTab(){switchTab('expenses',document.getElementById('tab-expenses'));}

// File input wrappers (file inputs can't use value delegation)
function handleItemReceiptFromEl(){var f=document.getElementById('iReceiptInput');if(f&&f.files&&f.files[0])handleItemReceipt(f.files[0]);}
function handleReceiptFileFromEl(){var f=document.getElementById('receiptFileInput');if(f&&f.files&&f.files[0])handleReceiptFile(f.files[0]);}
function handleCsvFileFromEl(){var f=document.getElementById('csvFileInput');if(f&&f.files&&f.files[0])handleCsvFile(f.files[0]);}
function obHandleReceiptFileFromEl(){var f=document.getElementById('obExpReceipt');if(f)obHandleReceiptFile(f);}

// Savings transaction wrappers (string arg + numeric arg)
function openTxnDeposit(i){if(typeof openTxn==='function')openTxn('deposit',i);}
function openTxnWithdraw(i){if(typeof openTxn==='function')openTxn('withdraw',i);}

// AI provider wrappers (string arg variants)
function aiRemoveKeyClaude(){if(typeof aiRemoveKey==='function')aiRemoveKey('claude');}
function aiRemoveKeyOpenai(){if(typeof aiRemoveKey==='function')aiRemoveKey('openai');}
function openAISetupClaude(){if(typeof openAISetup==='function')openAISetup('claude');}
function openAISetupOpenai(){if(typeof openAISetup==='function')openAISetup('openai');}
function openClaudeManageFromLink(){if(typeof openClaudeManage==='function')openClaudeManage();}

// ════════════════════════════════════════════════
// CLICK DELEGATION
// ════════════════════════════════════════════════
document.addEventListener('click',function(e){
  // 1. Modal overlay backdrop click — data-self-close="fnName"
  var overlay=e.target.closest('[data-self-close]');
  if(overlay&&e.target===overlay){
    var scFn=overlay.dataset.selfClose;
    if(typeof window[scFn]==='function')window[scFn]();
    return;
  }

  // 2. Action buttons — data-action="fnName"
  //    [data-arg="..."]          first argument (auto-coerced to number when numeric)
  //    [data-arg2="..."]         second argument (auto-coerced)
  //    [data-arg-self]           passes the element as the LAST positional argument
  //    [data-arg-from="attr"]    read first arg from another data attribute on the element
  //    [data-stop-prop]          call e.stopPropagation() before dispatching
  var el=e.target.closest('[data-action]');
  if(!el)return;

  if(el.dataset.stopProp!==undefined) e.stopPropagation();

  var fn=el.dataset.action;
  var fn2=el.dataset.action2;

  if(typeof window[fn]==='function'){
    var rawArg=el.dataset.arg;
    var rawArg2=el.dataset.arg2;
    var argFrom=el.dataset.argFrom;
    var argSelf=el.dataset.argSelf;
    var finalArg,finalArg2;

    if(argFrom!==undefined){
      finalArg=el.dataset[argFrom];
    } else if(rawArg!==undefined){
      finalArg=(rawArg.trim()!==''&&!isNaN(rawArg))?Number(rawArg):rawArg;
    }

    if(rawArg2!==undefined){
      finalArg2=(rawArg2.trim()!==''&&!isNaN(rawArg2))?Number(rawArg2):rawArg2;
    }

    if(argSelf!==undefined){
      // element is appended as the last argument after any data-arg / data-arg2
      if(finalArg!==undefined&&finalArg2!==undefined) window[fn](finalArg,finalArg2,el);
      else if(finalArg!==undefined) window[fn](finalArg,el);
      else window[fn](el);
    } else {
      if(finalArg!==undefined&&finalArg2!==undefined) window[fn](finalArg,finalArg2);
      else if(finalArg!==undefined) window[fn](finalArg);
      else window[fn]();
    }
  }

  // Optional second action — data-action2="fnName" (no extra args, used for side-effects)
  if(fn2&&typeof window[fn2]==='function') window[fn2]();
});

// ════════════════════════════════════════════════
// CHANGE DELEGATION
// data-change="fnName"
//   [data-change-val]      — pass el.value as first argument
//   [data-change-self]     — pass el (the element itself) as first argument
// ════════════════════════════════════════════════
document.addEventListener('change',function(e){
  var el=e.target.closest('[data-change]');
  if(!el)return;
  var fn=el.dataset.change;
  if(typeof window[fn]!=='function')return;
  if(el.dataset.changeVal!==undefined) window[fn](el.value);
  else if(el.dataset.changeSelf!==undefined) window[fn](el);
  else window[fn]();
});

// ════════════════════════════════════════════════
// INPUT DELEGATION
// data-input="fnName"
//   [data-input-val]       — pass el.value as first argument
//   [data-input-arg="x"]   — pass fixed string "x" as first argument
// ════════════════════════════════════════════════
document.addEventListener('input',function(e){
  var el=e.target.closest('[data-input]');
  if(!el)return;
  var fn=el.dataset.input;
  if(typeof window[fn]!=='function')return;
  if(el.dataset.inputVal!==undefined) window[fn](el.value);
  else if(el.dataset.inputArg!==undefined) window[fn](el.dataset.inputArg);
  else window[fn]();
});

// ════════════════════════════════════════════════
// DRAG EVENT DELEGATION
// Expense rows carry data-wi and data-ii; handlers
// read those instead of receiving args via inline attrs.
// ════════════════════════════════════════════════
document.addEventListener('dragstart',function(e){
  var el=e.target.closest('[data-wi]');
  if(!el)return;
  if(typeof dragStart==='function')dragStart(e,parseInt(el.dataset.wi),parseInt(el.dataset.ii));
});
document.addEventListener('dragover',function(e){
  var el=e.target.closest('[data-wi]');
  if(!el)return;
  if(typeof dragOver==='function')dragOver(e);
});
document.addEventListener('dragleave',function(e){
  var el=e.target.closest('[data-wi]');
  if(!el)return;
  if(typeof dragLeave==='function')dragLeave(e);
});
document.addEventListener('drop',function(e){
  var el=e.target.closest('[data-wi]');
  if(!el)return;
  if(typeof dragDrop==='function')dragDrop(e,parseInt(el.dataset.wi),parseInt(el.dataset.ii));
});
document.addEventListener('dragend',function(e){
  var el=e.target.closest('[data-wi]');
  if(!el)return;
  if(typeof dragEnd==='function')dragEnd(e);
});

// ════════════════════════════════════════════════
// KEYDOWN — Enter key delegation
// data-enter="fnName"          — call fn() on Enter
// data-enter-focus="elementId" — focus element on Enter
// ════════════════════════════════════════════════
document.addEventListener('keydown',function(e){
  if(e.key!=='Enter')return;
  var el=e.target.closest('[data-enter]');
  if(el){
    e.preventDefault();
    var fn=el.dataset.enter;
    if(typeof window[fn]==='function')window[fn]();
    return;
  }
  var fel=e.target.closest('[data-enter-focus]');
  if(fel){
    e.preventDefault();
    var t=document.getElementById(fel.dataset.enterFocus);
    if(t)t.focus();
  }
});
