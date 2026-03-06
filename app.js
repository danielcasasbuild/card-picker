// Card Picker (Phantom-ish UI behavior)
// - Placeholder icon when nothing is selected
// - Quick pick active state
// - Fuzzy search
// - Remembers last selection in localStorage

let data = null
const state = { activeKey: null }

const dom = {
  bestLogo: document.getElementById('bestLogo'),
  bestName: document.getElementById('bestName'),
  bestTag: document.getElementById('bestTag'),
  backupLogo: document.getElementById('backupLogo'),
  backupName: document.getElementById('backupName'),
  backupTag: document.getElementById('backupTag'),
  reason: document.getElementById('reason'),
  search: document.getElementById('search'),
}

function svgDataUri(svg){
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

const PLACEHOLDER_LOGO = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="g" cx="30%" cy="0%" r="80%">
      <stop offset="0%" stop-color="#9333ea" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="#22c55e" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#111827" stop-opacity="0.05"/>
    </radialGradient>
  </defs>
  <rect x="6" y="6" width="52" height="52" rx="18" fill="url(#g)" />
  <path fill="#f3f4f6" fill-opacity="0.88" d="M32.2 39.4c-1.7 0-2.9 1.2-2.9 2.8 0 1.7 1.2 2.8 2.9 2.8 1.7 0 2.9-1.1 2.9-2.8 0-1.6-1.2-2.8-2.9-2.8Zm-.1-21.2c-6.2 0-10.6 3.5-10.6 8.4h4.8c0-2.5 2.3-4.2 5.8-4.2 3.2 0 5.1 1.4 5.1 3.7 0 1.7-1 2.8-3.1 3.8l-2 1c-3.1 1.4-4.1 2.9-4.1 5.7v1.1h4.7v-1.1c0-1.7.5-2.4 2.6-3.4l2.2-1c3.8-1.7 5.2-3.6 5.2-6.8 0-5-3.9-8.4-10.6-8.4Z"/>
</svg>
`)

function resolveLogo(key){
  if(!key) return PLACEHOLDER_LOGO
  if(key.startsWith('http') || key.startsWith('data:') || key.startsWith('icons/')) return key
  const logos = data?.logos || {}
  if(logos[key]) return logos[key]
  return PLACEHOLDER_LOGO
}

function setActiveKey(key){
  state.activeKey = key
  try{
    if(key) localStorage.setItem('cp:last', key)
    else localStorage.removeItem('cp:last')
  } catch(e){}

  // toggle quick-pick pills
  document.querySelectorAll('.quick button[data-key]').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.key === key)
  })
}

function setCard(type, card){
  const logoEl = dom[`${type}Logo`]
  const nameEl = dom[`${type}Name`]
  const tagEl = dom[`${type}Tag`]

  if(!logoEl || !nameEl) return

  if(card){
    logoEl.src = resolveLogo(card.logo)
    logoEl.alt = (card.name || 'Card') + ' logo'
    nameEl.textContent = card.name || '—'
    if(tagEl) tagEl.textContent = card.tag || ''
  } else {
    logoEl.src = PLACEHOLDER_LOGO
    logoEl.alt = 'No selection'
    nameEl.textContent = '—'
    if(tagEl) tagEl.textContent = ''
  }
}

function resetUI(message){
  setActiveKey(null)
  setCard('best', null)
  setCard('backup', null)
  if(dom.reason) dom.reason.textContent = message || ''
}

function bestKeyMatch(query){
  if(!data?.categories) return null
  const keys = Object.keys(data.categories)
  const q = (query||'').trim().toLowerCase()
  if(!q) return null
  if(keys.includes(q)) return q

  const starts = keys.filter(k=>k.startsWith(q))
  if(starts.length) return starts.sort((a,b)=>a.length-b.length || a.localeCompare(b))[0]

  const inc = keys.filter(k=>k.includes(q))
  if(inc.length) return inc.sort((a,b)=>a.length-b.length || a.localeCompare(b))[0]

  return null
}

function pick(key){
  if(!data?.categories) {
    resetUI('')
    return
  }

  const result = data.categories[key]
  if(!result){
    resetUI('No match')
    return
  }

  setActiveKey(key)
  setCard('best', {
    name: result.best?.name,
    logo: result.best?.logo || result.best?.logoKey || result.best?.logoId,
    tag: result.best?.tag || `Boosted: ${key}`
  })
  setCard('backup', {
    name: result.backup?.name,
    logo: result.backup?.logo || result.backup?.logoKey || result.backup?.logoId,
    tag: result.backup?.tag || 'Backup'
  })

  if(dom.reason) dom.reason.textContent = result.reason || ''
}

async function init(){
  await loadData()

  // wire quick buttons
  document.querySelectorAll('.quick button[data-key]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const k = btn.dataset.key
      pick(k)
      if(dom.search){
        dom.search.value = ''
      }
    })
  })

  // search
  if(dom.search){
    dom.search.addEventListener('input', e=>{
      const q = e.target.value
      const match = bestKeyMatch(q)
      if(match){
        pick(match)
      } else {
        resetUI(q ? 'No match' : '')
      }
    })
  }

  // restore last selection
  let last = null
  try{
    last = localStorage.getItem('cp:last') || null
  }catch(e){}
  if(last) pick(last)
  else resetUI('Pick a category or search a store')
}

// Load JSON
async function loadData(){
  try{
    const res = await fetch('cards.json')
    data = await res.json()
  }catch(err){
    console.error('Failed to load cards.json', err)
  }
}

init()

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js')
}
