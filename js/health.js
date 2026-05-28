// === health.js ===

// ══════════════════════════════════════════════
// HEALTH SCORE
// ══════════════════════════════════════════════
function calcHealth(){
  const rev=totalRev(),exp=totalExp(),debt=totalDebt(),mp=minPmts();
  const allI=cw().reduce((s,w)=>s+w.items.length,0);
  const pI=cw().reduce((s,w)=>s+w.items.filter(i=>i.paid).length,0);
  const sv=Math.max(0,totalSav());
  const cf=rev>0?Math.min(25,Math.max(0,((rev-exp)/rev)*40)):0;
  const dti=rev>0?Math.min(25,Math.max(0,(1-mp/rev)*30)):0;
  const pmt=allI>0?(pI/allI)*20:0;
  const dl=rev>0?Math.min(15,Math.max(0,(1-debt/(rev*12))*15)):0;
  const ss=rev>0?Math.min(10,Math.max(0,(sv/(rev*3))*10)):0;
  const div=cr().length>1?5:0;
  const total=Math.min(100,Math.round(cf+dti+pmt+dl+ss+div));
  return{total,details:[{label:'Cash Flow',score:Math.round(cf),max:25},{label:'Debt-to-Income',score:Math.round(dti),max:25},{label:'Payment Rate',score:Math.round(pmt),max:20},{label:'Debt Load',score:Math.round(dl),max:15},{label:'Savings Buffer',score:Math.round(ss),max:10},{label:'Income Diversity',score:Math.round(div),max:5}]};
}
let _lastHealthScore=0;
function _animateScore(el,from,to){
  if(from===to){el.textContent=to;return;}
  const dur=600,start=performance.now();
  function step(now){
    const p=Math.min((now-start)/dur,1);
    const e=1-Math.pow(1-p,3);
    el.textContent=Math.round(from+(to-from)*e);
    if(p<1)requestAnimationFrame(step);else el.textContent=to;
  }
  requestAnimationFrame(step);
}
function updateHealth(){
  const{total}=calcHealth();
  const prev=_lastHealthScore;
  _lastHealthScore=total;
  const scoreEl=document.getElementById('healthScore');
  _animateScore(scoreEl,prev,total);
  const badge=document.querySelector('.health-badge');
  const badgeScore=badge.querySelector('.score'),lblEl=badge.querySelector('.hlabel');

  // Score 100 — perfect score
  if(total===100){
    badge.classList.add('score-perfect');
    badge.classList.remove('milestone');
    if(prev!==100){setTimeout(()=>{launchConfetti(220);showToast('🌟 Perfect score — 100/100!');},200);}
  } else {
    badge.classList.remove('score-perfect');
    // Crossed 75 milestone
    if(prev<75&&total>=75){
      badge.classList.add('milestone');
      setTimeout(()=>badge.classList.remove('milestone'),500);
      launchConfetti(60);showToast('🎉 Great financial health — score hit 75!');
      if(typeof awardXP==='function') awardXP('health_milestone');
    }
    if(prev<100&&total===100){if(typeof awardXP==='function') awardXP('health_milestone');}
    const[bg,bc,col]=total>=75?['var(--success-light)','var(--success-mid)','var(--success)']:total>=50?['var(--amber-light)','var(--amber-mid)','var(--amber)']:['var(--danger-light)','var(--danger-mid)','var(--danger)'];
    badge.style.background=bg;badge.style.borderColor=bc;badgeScore.style.color=col;lblEl.style.color=col;
  }

  // Gamification hooks
  if(typeof renderHealthTierPill==='function') renderHealthTierPill(total);
  if(typeof checkAchievements==='function') checkAchievements('perfect_score');
}
function openHealthModal(){
  const{total,details}=calcHealth();
  document.getElementById('modalScore').textContent=total;
  const offset=251-(251*total/100);
  const ring=document.getElementById('healthRing');ring.setAttribute('stroke-dashoffset',offset.toFixed(0));
  const col=total>=75?'#276749':total>=50?'#B7791F':'#C53030';ring.setAttribute('stroke',col);
  document.getElementById('scoreBreakdown').innerHTML=details.map(d=>`<div class="score-row"><span style="font-weight:500;min-width:120px;">${d.label}</span><div class="bw"><div class="bar-fill" style="width:${d.max>0?d.score/d.max*100:0}%;background:${col};"></div></div><span style="font-family:'DM Mono',monospace;font-size:11px;min-width:40px;text-align:right;">${d.score}/${d.max}</span></div>`).join('');
  document.getElementById('healthModal').classList.add('open');
  trapFocus(document.getElementById('healthModal'));
}
function closeHealthModal(){releaseTrap(document.getElementById('healthModal'));
  document.getElementById('healthModal').classList.remove('open');}
