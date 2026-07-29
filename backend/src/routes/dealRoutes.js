const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const {
  getDeals, getDeal, createDeal, updateDeal, deleteDeal,
  importDeals, exportDeals,
  addNote, deleteNote
} = require('../controllers/dealController')

router.get('/', authenticate, getDeals)
router.post('/', authenticate, createDeal)
router.post('/import', authenticate, importDeals)
router.get('/export', authenticate, exportDeals)
router.get('/:id', authenticate, getDeal)
router.put('/:id', authenticate, updateDeal)
router.delete('/:id', authenticate, deleteDeal)
router.post('/:id/notes', authenticate, addNote)
router.delete('/:id/notes/:noteId', authenticate, deleteNote)

module.exports = router
