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
const DR=[{name:'Demo Primary Income',amount:6200,received:true},{name:'Demo Side Income',amount:1750,received:false}];
const DL=[
  {name:'Demo Credit Card',amount:400,originalAmount:600,rate:19.99,minPayment:20,payments:[{month:'Jan 2026',paid:true},{month:'Feb 2026',paid:true},{month:'Mar 2026',paid:true},{month:'Apr 2026',paid:true},{month:'May 2026',paid:false}]},
  {name:'Demo Personal Loan',amount:850,originalAmount:1000,rate:8.5,minPayment:20,payments:[{month:'Jan 2026',paid:true},{month:'Feb 2026',paid:true},{month:'Mar 2026',paid:true},{month:'Apr 2026',paid:true},{month:'May 2026',paid:false}]}
];
const DSV=[{name:'Demo Emergency Fund',target:8000,balance:21000,contribution:250,rate:2.5},{name:'Demo Vacation Fund',target:2500,balance:640,contribution:100,rate:1.5}];

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

