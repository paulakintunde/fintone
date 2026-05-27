// === constants.js ===
const MF=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SK='finflow_v5';
const CAT_MAP={'bank charges':'cat-bank','interest mc':'cat-bank','interest ics':'cat-bank','od protection':'cat-bank','od interest':'cat-bank','mc charges':'cat-bank','fido':'cat-telecom','shaw':'cat-telecom','duoo':'cat-telecom','claude':'cat-telecom','hosting':'cat-telecom','td auto':'cat-auto','auto insurance':'cat-auto','gas':'cat-auto','bc hydro':'cat-utility','city of':'cat-utility','uhaul':'cat-utility','vgh':'cat-health','welfare':'cat-health','ics':'cat-loan','mbna':'cat-loan','cl payment':'cat-loan','nslsc':'cat-loan','savings':'cat-savings','emergency':'cat-savings','vacation fund':'cat-savings'};
const CAT_LABELS={'cat-bank':'Banking','cat-telecom':'Telecom','cat-auto':'Auto','cat-utility':'Utilities','cat-health':'Health','cat-loan':'Loan Pmt','cat-savings':'Savings','cat-other':'Other'};
const CAT_COLORS={'Banking':'#2B6CB0','Telecom':'#6B46C1','Auto':'#B7791F','Utilities':'#276749','Health':'#9D174D','Loan Pmt':'#718096','Savings':'#2B6CB0','Other':'#A0AEC0'};
const BDFT={'Banking':100,'Telecom':300,'Auto':600,'Utilities':250,'Health':200,'Loan Pmt':2500,'Savings':500,'Other':300};

function getCat(n){
  const l=n.toLowerCase();
  // Check user-defined categories first
  if(S&&S.customCategories){
    for(const cc of S.customCategories){
      if(cc.keywords.some(kw=>l.includes(kw.toLowerCase())))return 'cat-custom-'+cc.id;
    }
  }
  for(const[k,v]of Object.entries(CAT_MAP)){if(l.includes(k))return v;}
  return 'cat-other';
}

// ══════════════════════════════════════════════
// SEED DATA
// ══════════════════════════════════════════════
const DW=[
  {items:[{name:'Demo Rent',amount:1350,paid:true,dueDay:1},{name:'Demo Utilities',amount:87,paid:false,dueDay:5}]},
  {items:[{name:'Demo Phone Plan',amount:55,paid:true,dueDay:12},{name:'Demo Internet',amount:79,paid:false,dueDay:15}]},
  {items:[{name:'Demo Groceries',amount:310,paid:true,dueDay:20},{name:'Demo Car Insurance',amount:148,paid:false,dueDay:22}]},
  {items:[{name:'Demo Streaming',amount:18,paid:true,dueDay:27},{name:'Demo Gym',amount:45,paid:false,dueDay:28}]}
];
const DR=[{name:'Demo Primary Income',amount:3200,received:true},{name:'Demo Side Income',amount:750,received:false}];
// Generate demo payment history relative to today — last 4 months paid, current month pending
function _makeDemoPayments(){
  var now=new Date();
  return Array.from({length:5},function(_,i){
    var d=new Date(now.getFullYear(),now.getMonth()-(4-i),1);
    return{month:MS[d.getMonth()]+' '+d.getFullYear(),paid:i<4};
  });
}
const DL=[
  {name:'Demo Credit Card',amount:4800,originalAmount:6000,rate:19.99,minPayment:120,payments:_makeDemoPayments()},
  {name:'Demo Personal Loan',amount:8500,originalAmount:10000,rate:8.5,minPayment:210,payments:_makeDemoPayments()}
];
const DSV=[{name:'Demo Emergency Fund',target:8000,balance:2100,contribution:250,rate:2.5},{name:'Demo Vacation Fund',target:2500,balance:640,contribution:100,rate:1.5}];

// Category chart colours — intentionally hardcoded for consistent chart rendering
const catColors={'Banking':'#2B6CB0','Telecom':'#6B46C1','Auto':'#B7791F','Utilities':'#276749','Health':'#9D174D','Loan Pmt':'#718096','Savings':'#2B6CB0','Other':'#A0AEC0'};

const CAT_ALL=[
  {cls:'cat-bank',   lbl:'Banking',   icon:'🏦'},
  {cls:'cat-telecom',lbl:'Telecom',   icon:'📱'},
  {cls:'cat-auto',   lbl:'Auto',      icon:'🚗'},
  {cls:'cat-utility',lbl:'Utilities', icon:'💡'},
  {cls:'cat-health', lbl:'Health',    icon:'🏥'},
  {cls:'cat-loan',   lbl:'Loan Pmt',  icon:'💳'},
  {cls:'cat-savings',lbl:'Savings',   icon:'🏦'},
  {cls:'cat-other',  lbl:'Other',     icon:'📦'},
];

// ══════════════════════════════════════════════
// WEEK AUTO-DETECTION
// Returns 0-based week index (0=Week1) for a due day within a month.
// Aligns weeks with the calendar — the week a day physically falls in.
// e.g. if May 1 is a Thursday, days 1-3 are Week 1, days 4-10 are Week 2, etc.
// ══════════════════════════════════════════════
function getWeekForDay(day,monthKey){
  if(!day||day<1||day>31)return 0;
  var key=monthKey||(typeof CMK!=='undefined'?CMK:'');
  if(!key)return 0;
  var parts=key.split(' ');
  var mo=MS.indexOf(parts[0]);
  var yr=parseInt(parts[1]);
  if(mo<0||isNaN(yr))return 0;
  var firstDayOfMonth=new Date(yr,mo,1).getDay(); // 0=Sun … 6=Sat
  return Math.min(3,Math.floor((day-1+firstDayOfMonth)/7));
}

// Frequency labels used across the app
const FREQ_LABELS={
  monthly:  'Monthly',
  weekly:   'Weekly',
  biweekly: 'Bi-weekly',
  quarterly:'Quarterly',
  yearly:   'Yearly'
};
