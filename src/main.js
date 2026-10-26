import QRCode from 'qrcode'
import './style.css'

const app = document.querySelector('#app')


const STORAGE_KEY = 'ecoloop-demo-data'

function loadDemoData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { points: 0, deposits: 0, records: [] }

    const data = JSON.parse(saved)

    return {
      points: Number.isFinite(data.points) ? data.points : 0,
      deposits: Number.isFinite(data.deposits) ? data.deposits : 0,
      records: Array.isArray(data.records) ? data.records : []
    }
  } catch {
    return { points: 0, deposits: 0, records: [] }
  }
}

function saveDemoData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    points,
    deposits,
    records
  }))
}

const savedData = loadDemoData()

let points = savedData.points
let deposits = savedData.deposits
let quantity = 1
let successMessage = ''
let records = savedData.records
let activeView = new URLSearchParams(window.location.search).get('view') === 'deposit'
  ? 'deposit'
  : 'home'


const views = {
  home: `
    <section class="hero">
      <div class="eyebrow">Small actions. Greener future.</div>
      <h2>Give your old electronics a new purpose.</h2>
      <p>Recycle responsibly, earn EcoPoints, and help keep electronic waste out of landfills. Every small action makes a difference.</p>
      <div class="hero-actions">
        <button class="btn btn-primary" data-go="deposit">＋ Register a deposit</button>
        <button class="btn btn-outline" data-go="rewards">View my rewards →</button>
      </div>
    </section>

    <section class="stats">
      <article class="stat-card">
        <div class="stat-icon">🌱</div>
        <div class="stat-label">Your EcoPoints</div>
        <div class="stat-value" id="home-points">${points}</div>
        <div class="stat-note">Keep growing!</div>
      </article>
      <article class="stat-card">
        <div class="stat-icon">♻️</div>
        <div class="stat-label">Deposits registered</div>
        <div class="stat-value" id="home-deposits">${deposits}</div>
        <div class="stat-note">Every item counts</div>
      </article>
      <article class="stat-card">
        <div class="stat-icon">🏅</div>
        <div class="stat-label">Current level</div>
        <div class="stat-value">Starter</div>
        <div class="stat-note">Your green journey</div>
      </article>
    </section>

    <div class="section-heading">
      <div><h3>How EcoLoop works</h3><p>Three simple steps to recycle smarter.</p></div>
    </div>
    <section class="features">
      <article class="feature-card"><div class="feature-icon">📱</div><h4>1. Register</h4><p>Choose your e-waste item and enter the collection bin ID.</p><button class="btn btn-light" data-go="deposit">Register item →</button></article>
      <article class="feature-card"><div class="feature-icon">⭐</div><h4>2. Earn points</h4><p>Explore the demo rewards system and track your recycling activity.</p><button class="btn btn-light" data-go="rewards">View rewards →</button></article>
      <article class="feature-card"><div class="feature-icon">🚚</div><h4>3. Track</h4><p>See your local demo records and their verification status.</p><button class="btn btn-light" data-go="tracking">View records →</button></article>
    </section>
    <div class="notice">Demo note: points and records are stored only in this browser session. No real collection or recycler pickup is connected yet.</div>
  `,
  deposit: `
    <div class="section-heading"><div><h3>Register e-waste</h3><p>Record an item for your EcoLoop demo.</p></div></div>
    <section class="panel">
      <form id="deposit-form">
        <div class="form-grid">
          <div class="field"><label for="bin-id">Collection bin ID</label><input id="bin-id" value="EW-001" required maxlength="30"></div>
          <div class="field"><label for="item-type">Type of e-waste</label><select id="item" required><option>Mobile phone</option><option>Charger</option><option>USB cable</option><option>Headphones</option><option>Keyboard or mouse</option><option>Other small e-waste</option></select></div>
        </div>
        <div class="field"><label>Quantity (items)</label><div class="quantity-row"><button type="button" id="minus" aria-label="Decrease quantity">−</button><strong id="quantity">${quantity}</strong><button type="button" id="plus" aria-label="Increase quantity">+</button></div></div>

<div class="stat-card">
  <div class="stat-label">Estimated points for this deposit</div>
  <div class="stat-value" id="estimated-points">${quantity * 50}</div>
  <p>50 demo points per item</p>
</div>
<div class="notice">These are estimated demo points. Registration does not confirm physical collection or recycling.</div>
        <button class="btn btn-green" type="submit">Register demo deposit</button>
      </form>
    </section>
  `,
  rewards: `
    <div class="section-heading"><div><h3>Your rewards</h3><p>Celebrate your responsible choices.</p></div></div>
    <section class="stats">
      <article class="stat-card"><div class="stat-icon">🌿</div><div class="stat-label">Available demo points</div><div class="stat-value">${points}</div></article>
      <article class="stat-card"><div class="stat-icon">♻️</div><div class="stat-label">Registered items</div><div class="stat-value">${deposits}</div></article>
      <article class="stat-card"><div class="stat-icon">🏅</div><div class="stat-label">Badges earned</div><div class="stat-value">${deposits > 0 ? 1 : 0}</div></article>
    </section>
    <div class="reward-card"><div class="feature-icon">🌱</div><h4>Green Starter</h4><p>${deposits > 0 ? 'You registered your first demo deposit. Great start!' : 'Register your first demo deposit to begin your green journey.'}</p><strong>${deposits > 0 ? '✓ Badge unlocked in demo' : '🔒 Not yet unlocked'}</strong></div>
    <div class="notice">These are demonstration points and badges, not cash or redeemable rewards.</div>
  `,
  tracking: `
    ${successMessage ? `
    <div class="success-message">
      ✓ ${successMessage}
    </div>
  ` : ''}
    <div class="section-heading"><div><h3>Deposit tracking</h3><p>Review your browser-session demo records.</p></div><button class="btn btn-light" data-go="deposit">＋ Add record</button></div>


    <section class="panel"><h3>My records</h3>
    <p style="color: red; font-size: 20px;">TEST: RECORDS AREA</p>
${records.length === 0
  ? '<div class="empty">📦<p>No demo deposits yet.</p>Register an item to see it here.</div>'
  : records.map(record => `        

   <article class="record"><div><strong>${escapeHtml(record.item)}</strong><p>${escapeHtml(record.bin)} · Quantity: ${record.quantity}</p><p>${record.date}</p></div><div><small>${record.status}</small><button class="btn btn-light" data-remove="${records.indexOf(record)}" type="button">Remove</button></div></article>
      `).join('')}
    </section>
    <div class="notice">“Awaiting verification” is a demo status. EcoLoop is not connected to a real bin sensor or authorized recycler.</div>
    
  `
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character])
}

function render() {
  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand"><div class="brand-icon">♻️</div><div><h1>EcoLoop</h1><p>Smart E-Waste Network</p></div></div>
        <div class="status-pill">● DEMO MODE</div>
        </header>
      <main>
        <section class="view ${activeView === 'home' ? 'active' : ''}" id="view-home">${activeView === 'home' ? views.home : ''}</section>
        <section class="view ${activeView === 'deposit' ? 'active' : ''}" id="view-deposit">${activeView === 'deposit' ? views.deposit : ''}<div class="qr-card">
  <h3>Scan Your E-Waste Bin</h3>
  <p>Scan this code to identify bin EW-001.</p>
  <div id="bin-qr-code"></div>
  </div></section>
        <section class="view ${activeView === 'rewards' ? 'active' : ''}" id="view-rewards">${activeView === 'rewards' ? views.rewards : ''}</section>
        <section class="view ${activeView === 'tracking' ? 'active' : ''}" id="view-tracking">${activeView === 'tracking' ? views.tracking : ''}</section>
        <footer>EcoLoop · Design Thinking Prototype · Demo data only</footer>
      </main>
      <nav class="bottom-nav" aria-label="Main navigation">
        <button class="nav-btn ${activeView === 'home' ? 'active' : ''}" data-go="home"><span>⌂</span>Home</button>
        <button class="nav-btn ${activeView === 'deposit' ? 'active' : ''}" data-go="deposit"><span>＋</span>Deposit</button>
        <button class="nav-btn ${activeView === 'rewards' ? 'active' : ''}" data-go="rewards"><span>★</span>Rewards</button>
        <button class="nav-btn ${activeView === 'tracking' ? 'active' : ''}" data-go="tracking"><span>⌖</span>Tracking</button>
      </nav>
    </div>
  `;const qrArea = document.getElementById('bin-qr-code')
  console.log('QR area found:', !!qrArea)
   if (qrArea) {
  generateBinQRCode('EW-001')
  }
console.log('Tracking view:', activeView, 'Records:', records)
  app.querySelectorAll('[data-go]').forEach(button => {
    button.addEventListener('click', () => {
      activeView = button.dataset.go
      render()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  })
  
app.querySelectorAll('[data-remove]').forEach(button => {
  button.addEventListener('click', () => {
    const index = Number(button.dataset.remove)

    if (!Number.isInteger(index) || index < 0 || index >= records.length) return

    const removed = records.splice(index, 1)[0]
    deposits = Math.max(0, deposits - Number(removed.quantity || 0))
    points = Math.max(0, points - Number(removed.quantity || 0) * 50)

    saveDemoData()
    render()
  })
})



  const form = document.querySelector('#deposit-form')
  if (form) {
    document.querySelector('#minus').addEventListener('click', () => {
      quantity = Math.max(1, quantity - 1)
      document.querySelector('#quantity').textContent = quantity
      const estimate = document.querySelector('#estimated-points')
      if (estimate) estimate.textContent = quantity * 50
    })
    document.querySelector('#plus').addEventListener('click', () => {
      quantity = Math.min(100, quantity + 1)
      document.querySelector('#quantity').textContent = quantity
      const estimate = document.querySelector('#estimated-points')
      if (estimate) estimate.textContent = quantity * 50
    })
    form.addEventListener('submit', event => {
      console.log('Deposit form submitted')
      event.preventDefault()
      const bin = document.querySelector('#bin-id').value.trim()
      const item = document.querySelector('#item').value
      if (!bin) return

      records.unshift({
        bin, item, quantity,
        date: new Date().toLocaleString(),
        status: 'Awaiting verification'
      })
     console.log('Saved records:', records)
    deposits += quantity
    points += quantity * 50

   saveDemoData()
   successMessage = 'Demo deposit registered successfully!'
   quantity = 1
   activeView = 'tracking'
render()

    })
  }
}

render()



async function generateBinQRCode(binId) {
  const qrContainer = document.getElementById('bin-qr-code')
  if (!qrContainer) return

  qrContainer.innerHTML = ''

  const url = new URL(window.location.href)
  url.searchParams.set('view', 'deposit')
  url.searchParams.set('bin', binId)

  const canvas = document.createElement('canvas')
  qrContainer.appendChild(canvas)

  try {
    await QRCode.toCanvas(canvas, url.href, {
      width: 200,
      margin: 2
    })
    console.log('QR code generated successfully')
  } catch (error) {
    console.error('QR generation failed:', error)
  }
}


