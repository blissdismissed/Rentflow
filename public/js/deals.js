'use strict'

// ── State ──────────────────────────────────────────────────────────────────────
let deals = []
let currentDealId = null
let currentNotes = []
let pitiSettings = {}
let lang = localStorage.getItem('deals-lang') || 'en'
let importRows = []

const API = '/api'

// ── Auth / fetch ───────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('token') }

function logout() {
  localStorage.removeItem('token')
  window.location.href = '/auth/login.html'
}

async function apiFetch(method, path, body) {
  const token = getToken()
  if (!token) { logout(); return null }
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  }
  const res = await fetch(`${API}${path}`, opts)
  if (res.status === 401) { logout(); return null }
  return res
}

// ── PITI / DSCR ───────────────────────────────────────────────────────────────
function loadPitiSettings() {
  const stored = localStorage.getItem('deals-piti')
  pitiSettings = stored ? JSON.parse(stored) : {
    downPct: 20,
    ratePct: 7.5,
    termYears: 30,
    taxesInsDefault: 300
  }
}

function savePitiSettings() {
  pitiSettings = {
    downPct: parseFloat(document.getElementById('piti-down').value) || 20,
    ratePct: parseFloat(document.getElementById('piti-rate').value) || 7.5,
    termYears: parseInt(document.getElementById('piti-term').value, 10) || 30,
    taxesInsDefault: parseFloat(document.getElementById('piti-taxes').value) || 300
  }
  localStorage.setItem('deals-piti', JSON.stringify(pitiSettings))
  closeModal('modal-piti')
  if (currentDealId) updateMetrics()
  else renderList()
}

function calcMonthlyPI(precio) {
  const down = pitiSettings.downPct / 100
  const r = (pitiSettings.ratePct / 100) / 12
  const n = pitiSettings.termYears * 12
  const loan = precio * (1 - down)
  if (r === 0) return loan / n
  return loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
}

function calcPITI(deal) {
  const precio = parseFloat(deal.precio)
  if (!precio || deal.soloEfectivo) return null
  const pi = calcMonthlyPI(precio)
  const taxesIns = deal.taxesInsuranceMonthly != null
    ? parseFloat(deal.taxesInsuranceMonthly)
    : pitiSettings.taxesInsDefault
  const hoa = parseFloat(deal.hoaMonthly) || 0
  return pi + taxesIns + hoa
}

function calcDSCR(deal) {
  const rent = parseFloat(deal.rentaMensualEstimada)
  if (!rent) return null
  const piti = calcPITI(deal)
  if (!piti) return null
  return rent / piti
}

function getTrafficLight(deal) {
  const dscr = calcDSCR(deal)
  if (dscr === null) return 'na'
  const reno = parseFloat(deal.presupuestoRenovacion)
  const arv = parseFloat(deal.arv)
  const renoRatio = (reno > 0 && arv > 0) ? reno / arv : null
  if (dscr >= 1.25 && (renoRatio === null || renoRatio <= 0.80)) return 'verde'
  if (dscr >= 1.0 && (renoRatio === null || renoRatio <= 0.85)) return 'amarillo'
  return 'rojo'
}

const LIGHT_COLORS = {
  verde: 'bg-green-500',
  amarillo: 'bg-yellow-400',
  rojo: 'bg-red-500',
  na: 'bg-gray-300'
}
const LIGHT_KEYS = {
  verde: 'light_verde',
  amarillo: 'light_amarillo',
  rojo: 'light_rojo',
  na: 'light_na'
}

// ── i18n ───────────────────────────────────────────────────────────────────────
function t(key) {
  const tr = window.TRANSLATIONS && window.TRANSLATIONS[lang]
  return (tr && tr[key]) || key
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n)
  })
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder)
  })
  document.getElementById('lang-btn').textContent = lang.toUpperCase()
  document.getElementById('html-root').lang = lang
}

function toggleLang() {
  lang = lang === 'en' ? 'es' : 'en'
  localStorage.setItem('deals-lang', lang)
  applyI18n()
  if (currentDealId) {
    updateMetrics()
    renderNotes(currentNotes)
  } else {
    renderList()
  }
}

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  not_contacted: 'bg-gray-100 text-gray-700',
  awaiting_response: 'bg-blue-100 text-blue-700',
  viewing_scheduled: 'bg-indigo-100 text-indigo-700',
  under_contract: 'bg-purple-100 text-purple-700',
  passed: 'bg-orange-100 text-orange-700',
  dead: 'bg-red-100 text-red-700'
}

const STATUS_ORDER = [
  'not_contacted', 'awaiting_response', 'viewing_scheduled',
  'under_contract', 'passed', 'dead'
]

function statusBadgeHTML(status) {
  const cls = STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'
  const label = t('status_' + status) || status
  return `<span class="text-xs px-2 py-0.5 rounded-full font-medium ${cls}">${escHtml(label)}</span>`
}

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '—'
  return '$' + Math.round(n).toLocaleString('en-US')
}

function fmtPct(ratio, decimals = 1) {
  if (ratio == null || isNaN(ratio)) return '—'
  return (ratio * 100).toFixed(decimals) + '%'
}

function escHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Navigation ─────────────────────────────────────────────────────────────────
function showListView() {
  document.getElementById('list-view').hidden = false
  document.getElementById('detail-view').hidden = true
  currentDealId = null
  currentNotes = []
}

function showDetailView() {
  document.getElementById('list-view').hidden = true
  document.getElementById('detail-view').hidden = false
}

function closeDetail() {
  showListView()
  renderList()
}

// ── List ───────────────────────────────────────────────────────────────────────
function applyFilters() {
  const status = document.getElementById('filter-status').value
  const municipio = document.getElementById('filter-municipio').value
  const financing = document.getElementById('filter-financing').value
  const search = document.getElementById('filter-search').value.toLowerCase().trim()
  const sortBy = document.getElementById('sort-by').value
  const LIGHT_ORDER = { verde: 0, amarillo: 1, rojo: 2, na: 3 }

  let filtered = deals.filter(d => {
    if (status && d.estadoSeguimiento !== status) return false
    if (municipio && d.municipio !== municipio) return false
    if (financing === 'cash' && !d.soloEfectivo) return false
    if (financing === 'financeable' && d.soloEfectivo) return false
    if (search) {
      const hay = [d.nombre, d.municipio, d.barrio, d.clasificadoId]
        .filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })

  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return (parseFloat(b.precio) || 0) - (parseFloat(a.precio) || 0)
      case 'dscr': {
        const da = calcDSCR(a), db = calcDSCR(b)
        if (da == null && db == null) return 0
        if (da == null) return 1
        if (db == null) return -1
        return db - da
      }
      case 'status':
        return STATUS_ORDER.indexOf(a.estadoSeguimiento) - STATUS_ORDER.indexOf(b.estadoSeguimiento)
      case 'light':
        return LIGHT_ORDER[getTrafficLight(a)] - LIGHT_ORDER[getTrafficLight(b)]
      default:
        return new Date(b.createdAt) - new Date(a.createdAt)
    }
  })

  renderGrid(filtered)
}

function renderList() {
  // Refresh municipio dropdown
  const munis = [...new Set(deals.map(d => d.municipio).filter(Boolean))].sort()
  const sel = document.getElementById('filter-municipio')
  const cur = sel.value
  sel.innerHTML = `<option value="">${t('filter_municipio')}</option>` +
    munis.map(m => `<option value="${escHtml(m)}"${m === cur ? ' selected' : ''}>${escHtml(m)}</option>`).join('')

  applyFilters()
}

function renderGrid(filtered) {
  const grid = document.getElementById('deals-grid')
  const countEl = document.getElementById('deal-count')

  if (filtered.length === 0) {
    const msg = deals.length === 0 ? t('empty_deals') : t('empty_filtered')
    grid.innerHTML = `<div class="md:col-span-2 text-center py-20 text-gray-400 text-sm">${escHtml(msg)}</div>`
    countEl.textContent = ''
    return
  }

  countEl.textContent = filtered.length + ' deal' + (filtered.length !== 1 ? 's' : '')
  grid.innerHTML = filtered.map(renderCard).join('')
}

function renderCard(deal) {
  const light = getTrafficLight(deal)
  const dscr = calcDSCR(deal)
  const piti = calcPITI(deal)
  const loc = [deal.barrio, deal.municipio].filter(Boolean).join(', ')
  const dscrStr = dscr != null ? dscr.toFixed(2) : null
  const pitiStr = piti ? fmtCurrency(piti) + '/mo' : null

  return `
<div class="bg-white rounded-xl border border-gray-200 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer p-5"
     onclick="openDetail('${escHtml(deal.id)}')">
  <div class="flex items-start justify-between gap-3 mb-3">
    <div class="flex items-start gap-2.5 min-w-0">
      <span class="light-dot ${LIGHT_COLORS[light]} mt-1" title="${escHtml(t(LIGHT_KEYS[light]))}"></span>
      <div class="min-w-0">
        <div class="font-semibold text-gray-900 text-sm leading-snug truncate">${escHtml(deal.nombre)}</div>
        ${loc ? `<div class="text-xs text-gray-500 mt-0.5 truncate">${escHtml(loc)}</div>` : ''}
      </div>
    </div>
    <div class="flex-shrink-0 text-right">
      <div class="text-sm font-semibold text-gray-800">${fmtCurrency(deal.precio)}</div>
      <div class="mt-1">${statusBadgeHTML(deal.estadoSeguimiento)}</div>
    </div>
  </div>
  <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-3 border-t border-gray-50">
    ${deal.unidades ? `<span>${deal.unidades} ${deal.unidades == 1 ? 'unit' : 'units'}</span>` : ''}
    ${dscrStr ? `<span>DSCR: <span class="font-medium text-gray-700">${dscrStr}</span></span>` : ''}
    ${pitiStr ? `<span>PITI: ${pitiStr}</span>` : ''}
    ${deal.soloEfectivo ? `<span class="text-orange-600 font-medium">${t('filter_cash_only')}</span>` : ''}
  </div>
</div>`
}

// ── Detail view ────────────────────────────────────────────────────────────────
async function openDetail(id) {
  showDetailView()
  currentDealId = id

  const res = await apiFetch('GET', `/deals/${id}`)
  if (!res) return
  if (!res.ok) { closeDetail(); return }

  const deal = await res.json()
  currentNotes = deal.notes || []
  populateForm(deal)
  renderNotes(currentNotes)
  updateMetrics()
}

const TEXT_FIELDS = [
  'nombre', 'clasificadoId', 'barrio', 'municipio', 'urlFuente',
  'cuartosBanos', 'financingNotes', 'condicion', 'contadoresSeparados',
  'tituloVerificado', 'ocupadoActualmente', 'agenteOFsbo', 'contacto',
  'estadoSeguimiento'
]
const NUM_FIELDS = [
  'precio', 'unidades', 'rentaMensualEstimada', 'rentaAnualDeclarada',
  'presupuestoRenovacion', 'arv', 'taxesInsuranceMonthly', 'hoaMonthly'
]

function populateForm(deal) {
  TEXT_FIELDS.forEach(f => {
    const el = document.getElementById('field-' + f)
    if (el) el.value = deal[f] != null ? deal[f] : ''
  })
  NUM_FIELDS.forEach(f => {
    const el = document.getElementById('field-' + f)
    if (el) el.value = deal[f] != null ? deal[f] : ''
  })
  document.getElementById('field-soloEfectivo').checked = !!deal.soloEfectivo
  document.getElementById('field-requierePruebaFondos').checked = !!deal.requierePruebaFondos
  document.getElementById('field-fechaContacto').value =
    deal.fechaContacto ? deal.fechaContacto.substring(0, 10) : ''

  // URL open link
  const urlInput = document.getElementById('field-urlFuente')
  const urlLink = document.getElementById('url-open-link')
  function syncUrlLink() {
    if (urlInput.value) {
      urlLink.href = urlInput.value
      urlLink.classList.remove('hidden')
      urlLink.classList.add('flex')
    } else {
      urlLink.classList.add('hidden')
      urlLink.classList.remove('flex')
    }
  }
  syncUrlLink()
  urlInput.oninput = syncUrlLink
}

function collectForm() {
  const data = {}
  TEXT_FIELDS.forEach(f => {
    const el = document.getElementById('field-' + f)
    data[f] = el ? (el.value.trim() || null) : null
  })
  NUM_FIELDS.forEach(f => {
    const el = document.getElementById('field-' + f)
    data[f] = el && el.value !== '' ? parseFloat(el.value) : null
  })
  data.soloEfectivo = document.getElementById('field-soloEfectivo').checked
  data.requierePruebaFondos = document.getElementById('field-requierePruebaFondos').checked
  const dateEl = document.getElementById('field-fechaContacto')
  data.fechaContacto = dateEl.value || null
  return data
}

function updateMetrics() {
  const deal = collectForm()
  const light = getTrafficLight(deal)
  const dscr = calcDSCR(deal)
  const piti = calcPITI(deal)
  const rent = parseFloat(deal.rentaMensualEstimada)
  const cashflow = (rent && piti) ? rent - piti : null
  const rentToPrice = (rent && deal.precio) ? rent / deal.precio : null
  const reno = parseFloat(deal.presupuestoRenovacion)
  const arv = parseFloat(deal.arv)
  const renoArv = (reno > 0 && arv > 0) ? reno / arv : null

  document.getElementById('metric-light-dot').className = `light-dot ${LIGHT_COLORS[light]}`
  document.getElementById('metric-light-label').textContent = t(LIGHT_KEYS[light])
  document.getElementById('metric-dscr').textContent = dscr != null ? dscr.toFixed(2) : '—'
  document.getElementById('metric-piti').textContent = piti ? fmtCurrency(piti) : '—'
  document.getElementById('metric-cashflow').textContent =
    cashflow != null ? fmtCurrency(cashflow) : '—'
  document.getElementById('metric-rent-price').textContent = fmtPct(rentToPrice, 2)
  document.getElementById('metric-reno-arv').textContent = fmtPct(renoArv, 1)

  // Update status badge
  const status = deal.estadoSeguimiento || 'not_contacted'
  const badge = document.getElementById('detail-status-badge')
  badge.className = `text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`
  badge.textContent = t('status_' + status) || status
}

async function saveDeal() {
  const btn = document.getElementById('save-btn')
  const origText = btn.textContent
  btn.textContent = '…'
  btn.disabled = true

  const data = collectForm()
  if (!data.nombre) {
    alert(t('error_nombre_required'))
    btn.textContent = origText
    btn.disabled = false
    return
  }

  const res = await apiFetch('PUT', `/deals/${currentDealId}`, data)
  btn.disabled = false
  if (!res) return

  if (res.ok) {
    const updated = await res.json()
    const idx = deals.findIndex(d => d.id === currentDealId)
    if (idx >= 0) deals[idx] = updated
    btn.textContent = t('settings_saved')
    setTimeout(() => { btn.textContent = t('btn_save') }, 2000)
  } else {
    btn.textContent = origText
    alert(t('error_generic'))
  }
}

async function confirmDeleteDeal() {
  if (!confirm(t('confirm_delete_deal'))) return
  const res = await apiFetch('DELETE', `/deals/${currentDealId}`)
  if (!res || !res.ok) { alert(t('error_generic')); return }
  deals = deals.filter(d => d.id !== currentDealId)
  closeDetail()
}

// ── Notes ──────────────────────────────────────────────────────────────────────
function renderNotes(notes) {
  currentNotes = notes
  const list = document.getElementById('notes-list')
  if (!notes || notes.length === 0) {
    list.innerHTML = `<p class="text-sm text-gray-400 italic">${t('notes_empty')}</p>`
    return
  }
  const locale = lang === 'es' ? 'es-PR' : 'en-US'
  list.innerHTML = notes.map(n => `
<div class="flex gap-3 bg-gray-50 rounded-lg p-3">
  <div class="flex-1 min-w-0">
    <p class="text-sm text-gray-800 whitespace-pre-wrap">${escHtml(n.text)}</p>
    <p class="text-xs text-gray-400 mt-1">${new Date(n.createdAt).toLocaleString(locale)}</p>
  </div>
  <button onclick="deleteNote('${escHtml(n.id)}')"
    class="text-gray-300 hover:text-red-500 transition flex-shrink-0 mt-0.5"
    title="${t('confirm_delete_note')}">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  </button>
</div>`).join('')
}

async function addNote() {
  const input = document.getElementById('note-input')
  const text = input.value.trim()
  if (!text) return

  const res = await apiFetch('POST', `/deals/${currentDealId}/notes`, { text })
  if (!res || !res.ok) { alert(t('error_generic')); return }

  const note = await res.json()
  currentNotes = [...currentNotes, note]
  renderNotes(currentNotes)
  input.value = ''
}

async function deleteNote(noteId) {
  if (!confirm(t('confirm_delete_note'))) return
  const res = await apiFetch('DELETE', `/deals/${currentDealId}/notes/${noteId}`)
  if (!res || !res.ok) { alert(t('error_generic')); return }
  currentNotes = currentNotes.filter(n => n.id !== noteId)
  renderNotes(currentNotes)
}

// ── Quick Add ──────────────────────────────────────────────────────────────────
async function submitQuickAdd() {
  const nombre = document.getElementById('qa-nombre').value.trim()
  const errEl = document.getElementById('qa-error')
  if (!nombre) {
    errEl.textContent = t('error_nombre_required')
    errEl.classList.remove('hidden')
    return
  }
  errEl.classList.add('hidden')

  const payload = {
    nombre,
    precio: document.getElementById('qa-precio').value || null,
    unidades: document.getElementById('qa-unidades').value || null,
    municipio: document.getElementById('qa-municipio').value.trim() || null,
    urlFuente: document.getElementById('qa-url').value.trim() || null
  }

  const res = await apiFetch('POST', '/deals', payload)
  if (!res || !res.ok) { alert(t('error_generic')); return }

  const deal = await res.json()
  deals.unshift(deal)
  ;['qa-nombre', 'qa-precio', 'qa-unidades', 'qa-municipio', 'qa-url']
    .forEach(id => { document.getElementById(id).value = '' })
  closeModal('modal-quick-add')
  renderList()
}

// ── CSV Import ─────────────────────────────────────────────────────────────────
const COL_MAP = {
  nombre: 'nombre', titulo: 'nombre', title: 'nombre', name: 'nombre',
  'nombre de la propiedad': 'nombre', 'property name': 'nombre',
  'clasificado id': 'clasificadoId', 'id del clasificado': 'clasificadoId',
  'listing id': 'clasificadoId', clasificadoid: 'clasificadoId',
  barrio: 'barrio', neighborhood: 'barrio', vecindario: 'barrio',
  municipio: 'municipio', municipality: 'municipio', ciudad: 'municipio', city: 'municipio',
  url: 'urlFuente', 'url fuente': 'urlFuente', 'url de fuente': 'urlFuente',
  'source url': 'urlFuente', link: 'urlFuente', enlace: 'urlFuente',
  precio: 'precio', price: 'precio', 'purchase price': 'precio', 'precio de compra': 'precio',
  unidades: 'unidades', units: 'unidades', 'num unidades': 'unidades',
  'cuartos/banos': 'cuartosBanos', 'cuartos banos': 'cuartosBanos',
  'cuartos/banos': 'cuartosBanos', 'bed/bath': 'cuartosBanos', 'beds/baths': 'cuartosBanos',
  cuartos: 'cuartosBanos',
  'renta mensual estimada': 'rentaMensualEstimada', 'renta mensual': 'rentaMensualEstimada',
  'estimated monthly rent': 'rentaMensualEstimada', 'monthly rent': 'rentaMensualEstimada',
  'est monthly rent': 'rentaMensualEstimada',
  'renta anual declarada': 'rentaAnualDeclarada', 'renta anual': 'rentaAnualDeclarada',
  'declared annual rent': 'rentaAnualDeclarada', 'annual rent': 'rentaAnualDeclarada',
  'presupuesto de renovacion': 'presupuestoRenovacion',
  'presupuesto renovacion': 'presupuestoRenovacion',
  presupuesto: 'presupuestoRenovacion', 'renovation budget': 'presupuestoRenovacion',
  'reno budget': 'presupuestoRenovacion',
  arv: 'arv', 'after repair value': 'arv',
  'solo efectivo': 'soloEfectivo', 'cash only': 'soloEfectivo',
  'requiere prueba de fondos': 'requierePruebaFondos', 'proof of funds required': 'requierePruebaFondos',
  'notas de financiamiento': 'financingNotes', 'financing notes': 'financingNotes',
  condicion: 'condicion', condition: 'condicion',
  estado: 'estadoSeguimiento', 'estado de seguimiento': 'estadoSeguimiento',
  status: 'estadoSeguimiento', 'tracking status': 'estadoSeguimiento',
  contacto: 'contacto', contact: 'contacto',
  'agente o fsbo': 'agenteOFsbo', 'agente / fsbo': 'agenteOFsbo',
  'agent / fsbo': 'agenteOFsbo', agent: 'agenteOFsbo', agente: 'agenteOFsbo',
  'ocupado actualmente': 'ocupadoActualmente', 'currently occupied': 'ocupadoActualmente',
  'titulo verificado': 'tituloVerificado', 'title status': 'tituloVerificado',
  'contadores separados': 'contadoresSeparados', 'separate meters': 'contadoresSeparados'
}

function normHeader(h) {
  // eslint-disable-next-line no-misleading-character-class
  return h.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[()$?]/g, '')
    .replace(/\s+/g, ' ').trim()
}

function handleImportFile() {
  const file = document.getElementById('import-file').files[0]
  if (!file) return
  importRows = []
  document.getElementById('import-confirm-btn').disabled = true
  document.getElementById('import-preview').classList.add('hidden')
  document.getElementById('import-status').classList.add('hidden')

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete(results) {
      if (!results.data || results.data.length === 0) {
        setImportStatus(t('import_error'), 'error')
        return
      }

      const rawHeaders = Object.keys(results.data[0])
      const headerMap = {} // rawHeader → apiField
      for (const h of rawHeaders) {
        const norm = normHeader(h)
        const field = COL_MAP[norm]
        if (field) headerMap[h] = field
      }

      importRows = results.data.map(row => {
        const out = {}
        for (const [h, field] of Object.entries(headerMap)) {
          if (row[h] !== undefined && row[h] !== '') out[field] = row[h]
        }
        return out
      }).filter(r => r.nombre)

      if (importRows.length === 0) {
        setImportStatus(
          "No valid rows found. Ensure your CSV has a 'nombre' or 'name' column.",
          'error'
        )
        return
      }

      const previewCols = ['nombre', 'municipio', 'precio', 'unidades', 'rentaMensualEstimada']
      const preview = document.getElementById('import-preview')
      preview.innerHTML = `<table class="w-full text-xs">
<thead class="bg-gray-50 sticky top-0">
  <tr>${previewCols.map(c => `<th class="px-2 py-1.5 text-left font-medium text-gray-600 whitespace-nowrap">${c}</th>`).join('')}</tr>
</thead>
<tbody>
  ${importRows.slice(0, 6).map(r =>
    `<tr class="border-t border-gray-100">${previewCols.map(c =>
      `<td class="px-2 py-1 text-gray-700 max-w-24 truncate">${escHtml(r[c] ?? '')}</td>`
    ).join('')}</tr>`
  ).join('')}
</tbody></table>${importRows.length > 6 ? `<p class="px-2 py-1.5 text-gray-400 text-xs border-t">…and ${importRows.length - 6} more</p>` : ''}`
      preview.classList.remove('hidden')
      setImportStatus(
        `${importRows.length} row${importRows.length !== 1 ? 's' : ''} ready to import`,
        'info'
      )
      document.getElementById('import-confirm-btn').disabled = false
    },
    error() {
      setImportStatus(t('import_error'), 'error')
    }
  })
}

function setImportStatus(msg, type) {
  const el = document.getElementById('import-status')
  const classes = {
    error: 'bg-red-50 text-red-700',
    success: 'bg-green-50 text-green-700',
    info: 'bg-blue-50 text-blue-700'
  }
  el.className = `text-sm px-3 py-2 rounded-lg ${classes[type] || classes.info}`
  el.textContent = msg
  el.classList.remove('hidden')
}

async function submitImport() {
  if (importRows.length === 0) { setImportStatus(t('import_no_file'), 'error'); return }

  const btn = document.getElementById('import-confirm-btn')
  btn.disabled = true
  btn.textContent = '…'

  const res = await apiFetch('POST', '/deals/import', { deals: importRows })
  btn.textContent = t('import_confirm')

  if (!res || !res.ok) {
    btn.disabled = false
    setImportStatus(t('import_error'), 'error')
    return
  }

  const { created, skipped } = await res.json()
  const msg = t('import_success')
    .replace('{created}', created)
    .replace('{skipped}', skipped)
  setImportStatus(msg, 'success')

  await loadDeals()
  renderList()
  setTimeout(() => closeModal('modal-import'), 2500)
}

// ── CSV Export ─────────────────────────────────────────────────────────────────
async function exportCSV() {
  const res = await apiFetch('GET', '/deals/export')
  if (!res || !res.ok) { alert(t('error_generic')); return }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'deals.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Modals ─────────────────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.remove('hidden')

  if (id === 'modal-piti') {
    document.getElementById('piti-down').value = pitiSettings.downPct
    document.getElementById('piti-rate').value = pitiSettings.ratePct
    document.getElementById('piti-term').value = pitiSettings.termYears
    document.getElementById('piti-taxes').value = pitiSettings.taxesInsDefault
  }
  if (id === 'modal-quick-add') {
    document.getElementById('qa-error').classList.add('hidden')
    setTimeout(() => document.getElementById('qa-nombre').focus(), 50)
  }
  if (id === 'modal-import') {
    importRows = []
    document.getElementById('import-file').value = ''
    document.getElementById('import-preview').classList.add('hidden')
    document.getElementById('import-status').classList.add('hidden')
    document.getElementById('import-confirm-btn').disabled = true
    document.getElementById('import-confirm-btn').textContent = t('import_confirm')
  }
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden')
}

// ── Data loading ───────────────────────────────────────────────────────────────
async function loadDeals() {
  const res = await apiFetch('GET', '/deals')
  if (!res || !res.ok) {
    document.getElementById('deals-grid').innerHTML =
      `<div class="md:col-span-2 text-center py-20 text-red-400 text-sm">${t('error_load')}</div>`
    return
  }
  deals = await res.json()
}

// ── Init ───────────────────────────────────────────────────────────────────────
async function init() {
  if (!getToken()) {
    window.location.href = '/auth/login.html'
    return
  }
  loadPitiSettings()
  applyI18n()
  await loadDeals()
  renderList()

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      // Close any open modal first
      const modals = ['modal-quick-add', 'modal-import', 'modal-piti']
      const open = modals.find(id => !document.getElementById(id).classList.contains('hidden'))
      if (open) { closeModal(open); return }
      if (currentDealId) closeDetail()
    }
  })
}

document.addEventListener('DOMContentLoaded', init)
