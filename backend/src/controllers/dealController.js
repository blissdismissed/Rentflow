const { Op } = require('sequelize')
const Deal = require('../models/Deal')
const DealNote = require('../models/DealNote')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ownedDeal(id, userId) {
  return Deal.findOne({ where: { id, userId } })
}

function parseBoolean(val) {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'boolean') return val
  const s = String(val).toLowerCase().trim()
  if (['true', 'si', 'sí', 'yes', '1'].includes(s)) return true
  if (['false', 'no', '0'].includes(s)) return false
  return null
}

function sanitizeDeal(body) {
  const fields = [
    'nombre', 'clasificadoId', 'barrio', 'municipio', 'urlFuente',
    'precio', 'unidades', 'cuartosBanos',
    'rentaMensualEstimada', 'rentaAnualDeclarada', 'presupuestoRenovacion', 'arv',
    'financingNotes', 'contadoresSeparados', 'tituloVerificado', 'condicion',
    'ocupadoActualmente', 'agenteOFsbo', 'contacto', 'estadoSeguimiento',
    'fechaContacto', 'taxesInsuranceMonthly', 'hoaMonthly'
  ]
  const out = {}
  for (const f of fields) {
    if (f in body) out[f] = body[f] === '' ? null : body[f]
  }
  if ('soloEfectivo' in body) out.soloEfectivo = parseBoolean(body.soloEfectivo) ?? false
  if ('requierePruebaFondos' in body) out.requierePruebaFondos = parseBoolean(body.requierePruebaFondos) ?? false
  return out
}

// CSV escape helper
function csvCell(v) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

const CSV_HEADERS = [
  'id', 'nombre', 'clasificadoId', 'barrio', 'municipio', 'urlFuente',
  'precio', 'unidades', 'cuartosBanos',
  'rentaMensualEstimada', 'rentaAnualDeclarada', 'presupuestoRenovacion', 'arv',
  'soloEfectivo', 'requierePruebaFondos', 'financingNotes',
  'contadoresSeparados', 'tituloVerificado', 'condicion', 'ocupadoActualmente',
  'agenteOFsbo', 'contacto', 'estadoSeguimiento', 'fechaContacto',
  'taxesInsuranceMonthly', 'hoaMonthly', 'createdAt', 'updatedAt'
]

// ─── CRUD ─────────────────────────────────────────────────────────────────────

const getDeals = async (req, res) => {
  try {
    const deals = await Deal.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    })
    res.json(deals)
  } catch (err) {
    console.error('getDeals error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch deals' })
  }
}

const getDeal = async (req, res) => {
  try {
    const deal = await ownedDeal(req.params.id, req.user.id)
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' })

    const notes = await DealNote.findAll({
      where: { dealId: deal.id },
      order: [['createdAt', 'ASC']]
    })

    res.json({ ...deal.toJSON(), notes })
  } catch (err) {
    console.error('getDeal error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch deal' })
  }
}

const createDeal = async (req, res) => {
  try {
    if (!req.body.nombre) {
      return res.status(400).json({ error: 'nombre is required' })
    }
    const data = sanitizeDeal(req.body)
    const deal = await Deal.create({ ...data, userId: req.user.id })
    res.status(201).json(deal)
  } catch (err) {
    console.error('createDeal error:', err)
    res.status(500).json({ success: false, message: 'Failed to create deal' })
  }
}

const updateDeal = async (req, res) => {
  try {
    const deal = await ownedDeal(req.params.id, req.user.id)
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' })

    const data = sanitizeDeal(req.body)
    await deal.update(data)
    res.json(deal)
  } catch (err) {
    console.error('updateDeal error:', err)
    res.status(500).json({ success: false, message: 'Failed to update deal' })
  }
}

const deleteDeal = async (req, res) => {
  try {
    const deal = await ownedDeal(req.params.id, req.user.id)
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' })

    await DealNote.destroy({ where: { dealId: deal.id } })
    await deal.destroy()
    res.json({ success: true })
  } catch (err) {
    console.error('deleteDeal error:', err)
    res.status(500).json({ success: false, message: 'Failed to delete deal' })
  }
}

// ─── Bulk import ──────────────────────────────────────────────────────────────

const importDeals = async (req, res) => {
  try {
    const { deals } = req.body
    if (!Array.isArray(deals) || deals.length === 0) {
      return res.status(400).json({ success: false, message: 'deals array is required' })
    }

    const userId = req.user.id

    // Fetch existing clasificadoIds for this user to detect duplicates
    const existingIds = new Set(
      (await Deal.findAll({
        where: { userId, clasificadoId: { [Op.not]: null } },
        attributes: ['clasificadoId']
      })).map(d => d.clasificadoId)
    )

    let created = 0
    let skipped = 0

    for (const raw of deals) {
      if (!raw.nombre) continue

      const data = sanitizeDeal(raw)
      const cid = data.clasificadoId

      if (cid && existingIds.has(cid)) {
        skipped++
        continue
      }

      await Deal.create({ ...data, userId })
      if (cid) existingIds.add(cid)
      created++
    }

    res.json({ success: true, created, skipped })
  } catch (err) {
    console.error('importDeals error:', err)
    res.status(500).json({ success: false, message: 'Import failed' })
  }
}

// ─── CSV export ───────────────────────────────────────────────────────────────

const exportDeals = async (req, res) => {
  try {
    const deals = await Deal.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    })

    const rows = [CSV_HEADERS.join(',')]
    for (const d of deals) {
      const obj = d.toJSON()
      rows.push(CSV_HEADERS.map(h => csvCell(obj[h])).join(','))
    }

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="deals.csv"')
    res.send(rows.join('\n'))
  } catch (err) {
    console.error('exportDeals error:', err)
    res.status(500).json({ success: false, message: 'Export failed' })
  }
}

// ─── Notes ────────────────────────────────────────────────────────────────────

const addNote = async (req, res) => {
  try {
    const deal = await ownedDeal(req.params.id, req.user.id)
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' })

    const { text } = req.body
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'text is required' })
    }

    const note = await DealNote.create({
      dealId: deal.id,
      userId: req.user.id,
      text: text.trim()
    })

    res.status(201).json(note)
  } catch (err) {
    console.error('addNote error:', err)
    res.status(500).json({ success: false, message: 'Failed to add note' })
  }
}

const deleteNote = async (req, res) => {
  try {
    const deal = await ownedDeal(req.params.id, req.user.id)
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' })

    const note = await DealNote.findOne({
      where: { id: req.params.noteId, dealId: deal.id }
    })
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' })

    await note.destroy()
    res.json({ success: true })
  } catch (err) {
    console.error('deleteNote error:', err)
    res.status(500).json({ success: false, message: 'Failed to delete note' })
  }
}

module.exports = {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  importDeals,
  exportDeals,
  addNote,
  deleteNote
}
