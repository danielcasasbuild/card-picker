// Card Picker
let data=null;
const state={activeKey:null,activeCard:null,current:null};
const dom={bestLogo:document.getElementById("bestLogo"),bestName:document.getElementById("bestName"),bestLabel:document.getElementById("bestLabel"),bestReason:document.getElementById("bestReason"),backupLogo:document.getElementById("backupLogo"),backupName:document.getElementById("backupName"),backupLabel:document.getElementById("backupLabel"),backupReason:document.getElementById("backupReason"),quick:document.querySelectorAll(".quick button"),favorites:document.getElementById("favorites"),cards:document.querySelectorAll('.card[data-card]'),search:document.getElementById("search"),calcSelected:document.getElementById("calcSelected"),calcRate:document.getElementById("calcRate"),calcInput:document.getElementById("calcInput"),calcResult:document.getElementById("calcResult")};
const DATA_URL="cards.json?v=2";
const FAVORITE_H=56;
const PLACEHOLDER_LOGO='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" rx="16" fill="%2322294b" opacity=".22"/%3E%3C/svg%3E';
function resolveLogo(key){if(!key)return PLACEHOLDER_LOGO;if(key.startsWith('data:')||key.startsWith('http'))return key;return (data?.logos?.[key]||PLACEHOLDER_LOGO);}
function clearCard(t){dom[t+"Logo"].src=PLACEHOLDER_LOGO;dom[t+"Name"].textContent='—';dom[t+"Label"].textContent='';dom[t+"Reason"].textContent='';}
function setCard(t,card){if(!card){clearCard(t);return;}dom[t+"Logo"].src=resolveLogo(card.logo||card.key||card.name);dom[t+"Name"].textContent=card.name||'—';dom[t+"Label"].textContent=card.label||'';dom[t+"Reason"].textContent=card.reason||'';}
function favoritesShell(){return dom.favorites.parentElement;}
function scrollFavoriteTo(index){const shell=favoritesShell();shell.scrollTo({top:index*FAVORITE_H,behavior:'smooth'});} 
function setActiveKey(key){state.activeKey=key;
// categories
for(const b of dom.quick){b.classList.remove('active');if(key&&b.dataset.key===key)b.classList.add('active');}
// favorites highlight only if it exists
if(dom.favorites){const btns=dom.favorites.querySelectorAll('button');for(const b of btns){b.classList.remove('active');if(key!==null&&key!==undefined&&b.dataset.key===String(key))b.classList.add('active');}}
}
function setActiveCard(which){state.activeCard=which;for(const c of dom.cards){c.classList.toggle('active',c.dataset.card===which);}updateCalc();}
function resetUI(){state.current=null;setActiveKey(null);state.activeCard=null;clearCard('best');clearCard('backup');dom.calcSelected.textContent='—';dom.calcRate.textContent='—';dom.calcResult.textContent='—';dom.calcInput.value='';}
function pick(key){if(!data)return;const cat=data.categories?.[key];if(!cat){resetUI();return;}state.current=cat;setActiveKey(key);setCard('best',cat.best);setCard('backup',cat.backup);if(!state.activeCard)setActiveCard('best');else updateCalc();}
function parseAmount(v){if(!v)return 0;v=v.replace(/[^0-9.]/g,'');if(!v)return 0;return parseFloat(v)||0;}
function updateCalc(){if(!state.current||!state.activeCard){dom.calcSelected.textContent='—';dom.calcRate.textContent='—';dom.calcResult.textContent='—';return;}const card=state.activeCard==='best'?state.current.best:state.current.backup;dom.calcSelected.textContent=card?.name||'—';dom.calcRate.textContent=card?.label||'—';const amt=parseAmount(dom.calcInput.value);const reward=(amt*((card?.rate)||0));dom.calcResult.textContent= reward?`$${reward.toFixed(2)}`:'$0.00';}
function bestKeyMatch(q){if(!data||!q)return null;q=q.trim().toLowerCase();if(!q)return null;const cats=data.categories||{};if(cats[q])return q;if(q.length<2)return null;let best=null,bScore=-1;for(const key of Object.keys(cats)){const k=key.toLowerCase();let score=-1;if(k===q)score=100;if(score<0&&k.startsWith(q))score=70-q.length; if(score<0 && k.includes(q))score=40-q.length;
if(score> bScore){best=key;bScore=score;}}return best;}
function setupSearch(){dom.search?.addEventListener('input',e=>{const q=e.target.value;const key=bestKeyMatch(q);if(key){pick(key);} else{resetUI();}});}
function setupQuick(){dom.quick.forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.key;setActiveKey(key);pick(key);scrollFavoriteTo(0);}));}
function renderFavorites(){if(!dom.favorites)return;dom.favorites.innerHTML='';const base=[''];const list=(data?.favorites||[]);const favKeys=base.concat(list.map(x=>String(x)));
favKeys.forEach(key=>{const btn=document.createElement('button');btn.dataset.key=key;btn.textContent=key?key:'-';dom.favorites.appendChild(btn);});setupWheelScroll(favKeys);scrollFavoriteTo(0);resetUI();}
function setupWheelScroll(favKeys){const shell=favoritesShell();if(!shell)return;let ticking=false;const snap=()=>{ticking=false;const max=favKeys.length-1;let idx=Math.round(shell.scrollTop/FAVORITE_H);if(idx<0)idx=0;if(idx>max)idx=max;const key=favKeys[idx];shell.scrollTo({top:idx*FAVORITE_H,behavior:'smooth'});
if(idx===0){if(state.activeKey!==null){resetUI();}} else if(key && key!==state.activeKey){pick(key);} };shell.removeEventListener('scroll',shell._wheelListener||(()=>{}));shell._wheelListener=( )=>{if(!ticking){ticking=true;requestAnimationFrame(snap);} };shell.addEventListener('scroll',shell._wheelListener);}
function setupCards(){dom.cards.forEach(btn=>btn.addEventListener('click',()=>setActiveCard(btn.dataset.card)));dom.calcInput?.addEventListener('input',updateCalc);} 
async function load(){const res=await fetch(DATA_URL,{cache:'no-store'});data=await res.json();renderFavorites();setupSearch();setupQuick();setupCards();}
load();
if('serviceWorker' in navigator){navigator.serviceWorker.register('service-worker.js');}
