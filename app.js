// Card Picker
const DATA_URL="cards.json?v=3";
const FAVORITE_H=56;
const PLACEHOLDER_LOGO='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" rx="16" fill="%2322294b" opacity=".22"/%3E%3C/svg%3E';
let data=null;
let computed=null;
const state={activeKey:null,activeCard:null,current:null};
const dom={
search:document.getElementById('search'),
quick:Array.from(document.querySelectorAll('.quick button[data-key]')),
favorites:document.getElementById('favorites'),
cards:Array.from(document.querySelectorAll('.card[data-card]')),
bestLogo:document.getElementById('bestLogo'),
bestName:document.getElementById('bestName'),
bestLabel:document.getElementById('bestLabel'),
bestReason:document.getElementById('bestReason'),
backupLogo:document.getElementById('backupLogo'),
backupName:document.getElementById('backupName'),
backupLabel:document.getElementById('backupLabel'),
backupReason:document.getElementById('backupReason'),
calcSelected:document.getElementById('calcSelected'),
calcRate:document.getElementById('calcRate'),
calcInput:document.getElementById('calcInput'),
calcResult:document.getElementById('calcResult')
};
function resolveLogo(key){return !key?PLACEHOLDER_LOGO:(key.startsWith('data:')?key:key);} 
function getCategory(key){
if(!key)return null;
key=String(key).trim().toLowerCase();
if(!key)return null;
if(data.aliases&&data.aliases[key])return data.aliases[key];
if(data.category_order?.includes(key))return key;
return null;
}
function effectiveRate(card,rate){return card.type==='points'?(rate*(card.point_value||0)):rate;}
function labelFor(card,cat,rate,eff){
let label=card.labels?.[cat]??card.labels?.default;
if(!label){label=card.type==='points'?`${rate}x points`:`${(rate*100).toFixed(1)}% cash back`;}
if(card.type==='points'){label+=` (≈${(eff*100).toFixed(1)}% cash value)`;}
return label;
}
function prepCard(cardKey,card,cat){
const r=card.rates?.[cat];
const rate=(typeof r==='number'?r:(typeof card.base_rate==='number'?card.base_rate:0));
const eff=effectiveRate(card,rate);
return {key:cardKey,name:card.name,logo:data.logos?.[card.logo],effRate:eff,rate,label:labelFor(card,cat,rate,eff),unit:card.unit,type:card.type,pointsPerDollar:card.type==='points'?rate:0};
}
function compute(){
computed={categories:{}};
for(const cat of data.category_order||[]){
const list=[];
for(const [ck,card] of Object.entries(data.cards||{})){list.push(prepCard(ck,card,cat));}
list.sort((a,b)=>b.effRate-a.effRate);
computed.categories[cat]={best:list[0]||null,backup:list[1]||null};
}
}
function clearCard(which){
dom[which+'Logo'].src=PLACEHOLDER_LOGO;
dom[which+'Name'].textContent='—';
dom[which+'Label'].textContent='';
dom[which+'Reason'].textContent='';
}
function setCard(which,info){
if(!info){clearCard(which);return;}
dom[which+'Logo'].src=resolveLogo(info.logo);
dom[which+'Name'].textContent=info.name||'—';
dom[which+'Label'].textContent=info.unit||'';
dom[which+'Reason'].textContent=info.label||'';
}
function setActiveCard(which){
state.activeCard=which;
dom.cards.forEach(c=>c.classList.remove('active'));
const btn=dom.cards.find(c=>c.dataset.card===which);
if(btn)btn.classList.add('active');
updateCalc();
}
function setActiveKey(cat){
state.activeKey=cat;
dom.quick.forEach(b=>{
b.classList.remove('active');
if(cat && getCategory(b.dataset.key)===cat)b.classList.add('active');
});
}
function resetUI(){
state.current=null;
setActiveKey(null);
state.activeCard=null;
clearCard('best');
clearCard('backup');
dom.calcSelected.textContent='—';
dom.calcRate.textContent='—';
dom.calcInput.value='';
dom.calcResult.textContent='$0.00';
}
function pick(key){
if(!data||!computed)return;
const cat=getCategory(key);
if(!cat){resetUI();return;}
state.current=computed.categories[cat]||null;
if(!state.current){resetUI();return;}
setActiveKey(cat);
setCard('best',state.current.best);
setCard('backup',state.current.backup);
setActiveCard('best');
}
function parseAmount(v){
if(!v)return 0;
v=String(v).replace(/[^0-9.]/g,'');
if(!v)return 0;
const x=parseFloat(v);
return isNaN(x)?0:x;
}
function updateCalc(){
const cur=state.current;
if(!cur||!state.activeCard){
dom.calcSelected.textContent='—';
dom.calcRate.textContent='—';
dom.calcResult.textContent='$0.00';
return;
}
const info=cur[state.activeCard];
if(!info){dom.calcSelected.textContent='—';dom.calcRate.textContent='—';dom.calcResult.textContent='$0.00';return;}
const amount=parseAmount(dom.calcInput.value);
const rewardVal=amount*(info.effRate||0);
if(info.type==='points'){
const pts=amount*(info.pointsPerDollar||0);
dom.calcSelected.textContent=info.name;
dom.calcRate.textContent=info.label;
dom.calcResult.textContent=`${Math.round(pts)} ${info.unit} (≈$${rewardVal.toFixed(2)})`;
}else{
dom.calcSelected.textContent=info.name;
dom.calcRate.textContent=info.label;
dom.calcResult.textContent=`$${rewardVal.toFixed(2)}`;
}
}
function bestKeyMatch(q){
if(!data||!q)return null;
q=String(q).trim().toLowerCase();
if(!q||q.length<2)return null;
const candidates=new Set([...(Object.keys(data.aliases||{})),...(data.category_order||[])]);
let best=null,bScore=-1;
for(const key of candidates){
const k=key.toLowerCase();
if(k===q)return key;
let score=0;
if(k.startsWith(q))score=100-q.length;
else if(k.includes(q))score=50-q.length;
if(score>bScore){best=key;bScore=score;}
}
return best;
}
function setupSearch(){dom.search?.addEventListener('input',e=>{const key=bestKeyMatch(e.target.value);if(key)pick(key);else resetUI();});}
function setupQuick(){dom.quick.forEach(btn=>btn.addEventListener('click',()=>{pick(btn.dataset.key);}));}
function favoritesShell(){return dom.favorites?.parentElement;}
function renderFavorites(){const shell=favoritesShell();if(!shell||!dom.favorites)return;dom.favorites.innerHTML='';const items=['-'].concat(data.favorites||[]);for(const k of items){const btn=document.createElement('button');btn.dataset.key=k;btn.textContent=k;dom.favorites.appendChild(btn);}shell.scrollTo({top:0});if(renderFavorites.ready)return;renderFavorites.ready=true;let ticking=false;shell.addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;const idx=Math.round(shell.scrollTop/FAVORITE_H);shell.scrollTo({top:idx*FAVORITE_H,behavior:'smooth'});const btn=dom.favorites.querySelectorAll('button')[idx];const key=btn?.dataset.key||'';if(!key||key==='-'){resetUI();return;}pick(key);});});}
function setupCardTaps(){dom.cards.forEach(btn=>btn.addEventListener('click',()=>setActiveCard(btn.dataset.card)));dom.calcInput?.addEventListener('input',updateCalc);}
async function loadData(){const res=await fetch(DATA_URL);data=await res.json();compute();renderFavorites();resetUI();}
setupSearch();setupQuick();setupCardTaps();loadData();
