// === archive.js ===

let _restoreTarget = '';

// Parse a month key like "May 2026" → Date object (1st of that month)
function monthKeyToDate(k) {
  const p = k.split(' ');
  return new Date(parseInt(p[1]), MS.indexOf(p[0]), 1);
}

// Returns true if a month key is old enough to auto-archive
function shouldAutoArchive(k) {
  if (!S.archiveThreshold || S.archiveThreshold === 0) return false;
  const d = monthKeyToDate(k);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - S.archiveThreshold);
  cutoff.setDate(1);
  cutoff.setHours(0,0,0,0);
  return d < cutoff;
}

// Run at app boot — moves qualifying months into archivedMonths
function runAutoArchive() {
  if (!S.archivedMonths) S.archivedMonths = {};
  const activeKeys = Object.keys(S.months);
  let moved = 0;
  activeKeys.forEach(k => {
    if (shouldAutoArchive(k)) {
      S.archivedMonths[k] = S.months[k];
      delete S.months[k];
      moved++;
    }
  });
  // If CMK was archived, point to the most recent active month
  if (!S.months[CMK]) {
    const remaining = Object.keys(S.months);
    CMK = remaining.length ? remaining[remaining.length - 1] : '';
    S.currentMonthKey = CMK;
  }
  if (moved > 0) persist(false);
  updateArchiveBadge();
}

function updateArchiveBadge() {
  const count = Object.keys(S.archivedMonths || {}).length;
  const el = document.getElementById('archiveBadge');
  if (el) el.textContent = count;
}

function updateArchiveThreshold(val) {
  S.archiveThreshold = parseInt(val);
  persist();
  runAutoArchive();
  renderArchive();
  updateMonthLabel();
}

// ── Manual archive of a specific month ──
function archiveMonth(k) {
  if (!S.months[k]) return;
  if (!S.archivedMonths) S.archivedMonths = {};
  S.archivedMonths[k] = S.months[k];
  delete S.months[k];
  if (CMK === k) {
    const remaining = Object.keys(S.months);
    CMK = remaining.length ? remaining[remaining.length - 1] : '';
    S.currentMonthKey = CMK;
  }
  persist();
  updateArchiveBadge();
  renderExpenses();
  updateMonthLabel();
  showToast(`✓ ${k} archived`);
}

// ── Restore ──
function openRestoreModal(k) {
  _restoreTarget = k;
  document.getElementById('restoreModalDesc').textContent =
    `"${k}" will return to the active months list and become fully editable again.`;
  document.getElementById('restoreModal').classList.add('open');
  trapFocus(document.getElementById('restoreModal'));
  setTimeout(()=>{const _f=document.querySelector('#restoreModal button');if(_f)_f.focus();},120);
}
function closeRestoreModal() {
  releaseTrap(document.getElementById('restoreModal'));
  document.getElementById('restoreModal').classList.remove('open');
  _restoreTarget = '';
}
function executeRestore() {
  const k = _restoreTarget;
  if (!k || !S.archivedMonths[k]) return;
  S.months[k] = S.archivedMonths[k];
  delete S.archivedMonths[k];
  // Re-sort months chronologically
  const sorted = {};
  Object.keys(S.months).sort((a,b) => monthKeyToDate(a)-monthKeyToDate(b)).forEach(mk => sorted[mk] = S.months[mk]);
  S.months = sorted;
  CMK = k;
  S.currentMonthKey = k;
  persist();
  updateArchiveBadge();
  closeRestoreModal();
  updateMonthLabel();
  renderExpenses();
  updateHealth();
  showToast(`✓ ${k} restored`);
}

// ── Render the Archive tab ──
function renderArchive() {
  updateArchiveBadge();
  const archived = S.archivedMonths || {};
  const keys = Object.keys(archived).sort((a,b) => monthKeyToDate(b)-monthKeyToDate(a)); // newest first
  const list = document.getElementById('archiveList');

  // Sync threshold selector
  const sel = document.getElementById('archiveThreshold');
  if (sel) sel.value = S.archiveThreshold || 6;

  // Show / hide the readonly banner
  const banner = document.getElementById('archiveBanner');
  const restoreBtn = document.getElementById('archiveBannerRestoreBtn');
  if (banner) {
    if (keys.length) {
      document.getElementById('archiveBannerMsg').textContent =
        `${keys.length} archived month${keys.length > 1 ? 's' : ''} — read-only. Restore to edit.`;
      restoreBtn.style.display = 'none'; // each card has its own Restore button
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  }

  if (!keys.length) {
    list.innerHTML = `<div class="archive-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-muted);"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8L4 7h16l-4-4z"/></svg>
      No archived months yet.<br>
      <span style="font-size:12px;margin-top:6px;display:block;">Months older than ${S.archiveThreshold || 6} months will be automatically archived.</span>
    </div>`;
    return;
  }

  // Group by year
  const byYear = {};
  keys.forEach(k => {
    const yr = k.split(' ')[1];
    if (!byYear[yr]) byYear[yr] = [];
    byYear[yr].push(k);
  });

  list.innerHTML = Object.entries(byYear)
    .sort(([a],[b]) => parseInt(b)-parseInt(a)) // newest year first
    .map(([yr, monthKeys]) => {
      const monthBlocks = monthKeys.map(k => {
        const m = archived[k];
        const totalExp = m.weeks.reduce((s,w)=>s+w.items.reduce((a,i)=>a+i.amount,0),0);
        const paidExp = m.weeks.reduce((s,w)=>s+w.items.filter(i=>i.paid).reduce((a,i)=>a+i.amount,0),0);
        const totalRev = m.revenue.reduce((s,r)=>s+r.amount,0);
        const net = totalRev - totalExp;
        const allItems = m.weeks.reduce((s,w)=>s+w.items,[]);

        // Expense rows (show top 6, then summary)
        const expRows = allItems.slice(0,6).map(item =>
          `<div class="archive-item-row">
            <span>${esc(item.name)}</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-family:'DM Mono',monospace;font-size:12px;">${fmt(amt(item.amount))}</span>
              <span class="archive-paid-badge ${item.paid?'archive-paid':'archive-pending'}">${item.paid?'Paid':'Pending'}</span>
            </div>
          </div>`
        ).join('');
        const moreExp = allItems.length > 6 ? `<div style="font-size:11px;color:var(--text-muted);padding:5px 0;">+${allItems.length-6} more items</div>` : '';

        // Revenue rows
        const revRows = m.revenue.map(r =>
          `<div class="archive-item-row">
            <span>${esc(r.name)}</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-family:'DM Mono',monospace;font-size:12px;">${fmt(r.amount)}</span>
              <span class="archive-paid-badge ${r.received?'archive-paid':'archive-pending'}">${r.received?'Received':'Pending'}</span>
            </div>
          </div>`
        ).join('');

        const groupId = k.replace(' ','-');
        return `
          <div class="archive-month-group">
            <div class="archive-month-group-hdr" onclick="toggleArchiveGroup('${groupId}',this)" id="hdr-${groupId}">
              <div class="amg-title">
                <span>&#128197;</span> ${k}
                <span style="font-size:11px;font-weight:400;color:var(--text-muted);">
                  Exp: ${fmt(totalExp)} &nbsp;·&nbsp; Rev: ${fmt(totalRev)} &nbsp;·&nbsp; Net: <span style="color:${net>=0?'var(--success)':'var(--danger)'};">${net<0?'-':''}${fmt(Math.abs(net))}</span>
                </span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <button class="restore-btn" onclick="event.stopPropagation();openRestoreModal('${k}')">&#128260; Restore</button>
                <span class="amg-chevron">&#9654;</span>
              </div>
            </div>
            <div class="archive-month-body" id="body-${groupId}">
              <div class="archive-section-block">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <div class="archive-section-title">Expenses</div>
                  <span style="font-size:11px;color:var(--text-muted);">${allItems.length} items · Paid ${fmt(paidExp)} · Pending ${fmt(totalExp-paidExp)}</span>
                </div>
                ${expRows}${moreExp}
              </div>
              <div class="archive-section-block">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <div class="archive-section-title">Revenue</div>
                  <span style="font-size:11px;color:var(--text-muted);">Total ${fmt(totalRev)}</span>
                </div>
                ${revRows || '<div style="font-size:12px;color:var(--text-muted);">No revenue recorded</div>'}
              </div>
            </div>
          </div>`;
      }).join('');
      return `<div style="margin-bottom:6px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--text-muted);padding:6px 2px;margin-bottom:4px;">${yr}</div>
        ${monthBlocks}
      </div>`;
    }).join('');
}

function toggleArchiveGroup(id, hdr) {
  const body = document.getElementById('body-'+id);
  const isOpen = body.classList.toggle('open');
  hdr.classList.toggle('open', isOpen);
}


function confirmArchiveMonth(k) {
  if (Object.keys(S.months).length <= 1) {
    showToast('Cannot archive — keep at least one active month', 'warn-t');
    return;
  }
  // Use a simple inline confirmation via the existing restore modal repurposed
  _restoreTarget = '__archive__' + k;
  document.getElementById('restoreModalDesc').textContent =
    `Archive "${k}"? It will become read-only and move to the Archive tab. You can restore it any time.`;
  document.getElementById('restoreModal').classList.add('open');
  trapFocus(document.getElementById('restoreModal'));
  setTimeout(()=>{const _f=document.querySelector('#restoreModal button');if(_f)_f.focus();},120);
  // Override the confirm button behaviour temporarily
  document.getElementById('restoreModal').querySelector('.btn-p').onclick = function() {
    const key = _restoreTarget.replace('__archive__','');
    closeRestoreModal();
    archiveMonth(key);
  };
}
