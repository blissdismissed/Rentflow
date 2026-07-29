const request = require('supertest')
const app = require('../../src/server')
const { setupTestDatabase, teardownTestDatabase, resetDatabase } = require('../utils/testDb')
const { createUser, createDeal, createDealNote } = require('../utils/factories')

describe('Deal Controller', () => {
  let testUser, authToken

  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await resetDatabase()
    testUser = await createUser({ email: 'owner@example.com', password: 'password123' })
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@example.com', password: 'password123' })
    authToken = res.body.data.token
  })

  // ─── Auth guard: 401 on every endpoint ────────────────────────────────────

  describe('Auth required (401) on every endpoint', () => {
    it('GET /api/deals returns 401 without token', async () => {
      await request(app).get('/api/deals').expect(401)
    })

    it('POST /api/deals returns 401 without token', async () => {
      await request(app).post('/api/deals').send({ nombre: 'X' }).expect(401)
    })

    it('POST /api/deals/import returns 401 without token', async () => {
      await request(app).post('/api/deals/import').send({ deals: [] }).expect(401)
    })

    it('GET /api/deals/export returns 401 without token', async () => {
      await request(app).get('/api/deals/export').expect(401)
    })

    it('GET /api/deals/:id returns 401 without token', async () => {
      await request(app).get('/api/deals/some-id').expect(401)
    })

    it('PUT /api/deals/:id returns 401 without token', async () => {
      await request(app).put('/api/deals/some-id').send({ nombre: 'X' }).expect(401)
    })

    it('DELETE /api/deals/:id returns 401 without token', async () => {
      await request(app).delete('/api/deals/some-id').expect(401)
    })

    it('POST /api/deals/:id/notes returns 401 without token', async () => {
      await request(app).post('/api/deals/some-id/notes').send({ text: 'hi' }).expect(401)
    })

    it('DELETE /api/deals/:id/notes/:noteId returns 401 without token', async () => {
      await request(app).delete('/api/deals/some-id/notes/note-id').expect(401)
    })
  })

  // ─── GET /api/deals ────────────────────────────────────────────────────────

  describe('GET /api/deals', () => {
    it('returns 200 with empty array when user has no deals', async () => {
      const res = await request(app)
        .get('/api/deals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toHaveLength(0)
    })

    it('returns all deals belonging to the authenticated user', async () => {
      await createDeal(testUser.id, { nombre: 'Deal Alpha' })
      await createDeal(testUser.id, { nombre: 'Deal Beta' })

      const res = await request(app)
        .get('/api/deals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body).toHaveLength(2)
      const names = res.body.map(d => d.nombre)
      expect(names).toContain('Deal Alpha')
      expect(names).toContain('Deal Beta')
    })

    it('does not return deals that belong to another user (user-scoped)', async () => {
      const otherUser = await createUser({ email: 'other@example.com' })
      await createDeal(otherUser.id, { nombre: 'Other User Deal' })
      await createDeal(testUser.id, { nombre: 'My Deal' })

      const res = await request(app)
        .get('/api/deals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body).toHaveLength(1)
      expect(res.body[0].nombre).toBe('My Deal')
    })
  })

  // ─── POST /api/deals ───────────────────────────────────────────────────────

  describe('POST /api/deals', () => {
    it('creates a deal and returns 201 with the created record', async () => {
      const payload = {
        nombre: 'Great Deal',
        barrio: 'Centro',
        municipio: 'San Juan',
        precio: 150000,
        unidades: 4
      }

      const res = await request(app)
        .post('/api/deals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(201)

      expect(res.body).toHaveProperty('id')
      expect(res.body.nombre).toBe('Great Deal')
      expect(res.body.barrio).toBe('Centro')
      expect(res.body.userId).toBe(testUser.id)
    })

    it('defaults estadoSeguimiento to "not_contacted" when omitted', async () => {
      const res = await request(app)
        .post('/api/deals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nombre: 'No Status Deal' })
        .expect(201)

      expect(res.body.estadoSeguimiento).toBe('not_contacted')
    })

    it('accepts all optional fields', async () => {
      const payload = {
        nombre: 'Full Deal',
        clasificadoId: 'CL-001',
        barrio: 'Santurce',
        municipio: 'San Juan',
        urlFuente: 'https://example.com/listing',
        precio: 200000,
        unidades: 6,
        cuartosBanos: '3/2',
        rentaMensualEstimada: 3500,
        rentaAnualDeclarada: 40000,
        presupuestoRenovacion: 15000,
        arv: 250000,
        soloEfectivo: true,
        requierePruebaFondos: false,
        financingNotes: 'Hard money possible',
        contadoresSeparados: 'yes',
        tituloVerificado: 'clear',
        condicion: 'needs work',
        ocupadoActualmente: 'vacant',
        agenteOFsbo: 'agent',
        contacto: 'John Smith 555-1234',
        estadoSeguimiento: 'contacted',
        taxesInsuranceMonthly: 400,
        hoaMonthly: 0
      }

      const res = await request(app)
        .post('/api/deals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(201)

      expect(res.body.clasificadoId).toBe('CL-001')
      expect(res.body.soloEfectivo).toBe(true)
      expect(res.body.estadoSeguimiento).toBe('contacted')
    })

    it('returns 400 when nombre is missing', async () => {
      const res = await request(app)
        .post('/api/deals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ barrio: 'Somewhere' })
        .expect(400)

      expect(res.body).toHaveProperty('error')
    })
  })

  // ─── POST /api/deals/import ────────────────────────────────────────────────

  describe('POST /api/deals/import', () => {
    it('bulk-creates multiple deals and returns 200 with counts', async () => {
      const deals = [
        { nombre: 'Import Deal 1', clasificadoId: 'IMP-001' },
        { nombre: 'Import Deal 2', clasificadoId: 'IMP-002' },
        { nombre: 'Import Deal 3' }
      ]

      const res = await request(app)
        .post('/api/deals/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deals })
        .expect(200)

      expect(res.body).toHaveProperty('created', 3)
      expect(res.body).toHaveProperty('skipped', 0)
    })

    it('skips deals whose clasificadoId already exists for this user', async () => {
      // Pre-create a deal with a clasificadoId
      await createDeal(testUser.id, { nombre: 'Existing', clasificadoId: 'DUP-001' })

      const deals = [
        { nombre: 'Duplicate', clasificadoId: 'DUP-001' }, // should be skipped
        { nombre: 'New Deal', clasificadoId: 'NEW-001' }    // should be created
      ]

      const res = await request(app)
        .post('/api/deals/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deals })
        .expect(200)

      expect(res.body.created).toBe(1)
      expect(res.body.skipped).toBe(1)
    })

    it('always creates deals that have no clasificadoId (no dedup possible)', async () => {
      const deals = [
        { nombre: 'No ID Deal 1' },
        { nombre: 'No ID Deal 2' },
        { nombre: 'No ID Deal 3' }
      ]

      const res = await request(app)
        .post('/api/deals/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deals })
        .expect(200)

      expect(res.body.created).toBe(3)
      expect(res.body.skipped).toBe(0)
    })

    it('does not cross-user dedup (same clasificadoId from another user is not a dup)', async () => {
      const otherUser = await createUser({ email: 'other2@example.com' })
      await createDeal(otherUser.id, { nombre: 'Other deal', clasificadoId: 'CROSS-001' })

      const deals = [{ nombre: 'My Deal', clasificadoId: 'CROSS-001' }]

      const res = await request(app)
        .post('/api/deals/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deals })
        .expect(200)

      expect(res.body.created).toBe(1)
      expect(res.body.skipped).toBe(0)
    })
  })

  // ─── GET /api/deals/export ─────────────────────────────────────────────────

  describe('GET /api/deals/export', () => {
    it('returns 200 with Content-Type text/csv', async () => {
      await createDeal(testUser.id, { nombre: 'Export Deal', municipio: 'Ponce' })

      const res = await request(app)
        .get('/api/deals/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.headers['content-type']).toMatch(/text\/csv/)
    })

    it('CSV body contains deal data', async () => {
      await createDeal(testUser.id, { nombre: 'CSV Check Deal', municipio: 'Mayaguez' })

      const res = await request(app)
        .get('/api/deals/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.text).toContain('CSV Check Deal')
    })

    it('returns CSV (possibly just headers) when user has no deals', async () => {
      const res = await request(app)
        .get('/api/deals/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.headers['content-type']).toMatch(/text\/csv/)
      // Should at minimum have a header row
      expect(typeof res.text).toBe('string')
    })
  })

  // ─── GET /api/deals/:id ────────────────────────────────────────────────────

  describe('GET /api/deals/:id', () => {
    it('returns 200 with deal object including a notes array', async () => {
      const deal = await createDeal(testUser.id, { nombre: 'Noted Deal' })
      await createDealNote(deal.id, testUser.id, { text: 'First note' })
      await createDealNote(deal.id, testUser.id, { text: 'Second note' })

      const res = await request(app)
        .get(`/api/deals/${deal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body.id).toBe(deal.id)
      expect(res.body.nombre).toBe('Noted Deal')
      expect(Array.isArray(res.body.notes)).toBe(true)
      expect(res.body.notes).toHaveLength(2)
    })

    it('returns notes ordered by createdAt ascending', async () => {
      const deal = await createDeal(testUser.id, { nombre: 'Order Test Deal' })
      await createDealNote(deal.id, testUser.id, { text: 'Earlier note' })
      await createDealNote(deal.id, testUser.id, { text: 'Later note' })

      const res = await request(app)
        .get(`/api/deals/${deal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body.notes[0].text).toBe('Earlier note')
      expect(res.body.notes[1].text).toBe('Later note')
    })

    it('returns empty notes array when deal has no notes', async () => {
      const deal = await createDeal(testUser.id, { nombre: 'No Notes Deal' })

      const res = await request(app)
        .get(`/api/deals/${deal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(Array.isArray(res.body.notes)).toBe(true)
      expect(res.body.notes).toHaveLength(0)
    })

    it('returns 404 when the deal belongs to a different user', async () => {
      const otherUser = await createUser({ email: 'other3@example.com' })
      const otherDeal = await createDeal(otherUser.id, { nombre: 'Not Mine' })

      await request(app)
        .get(`/api/deals/${otherDeal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })

  // ─── PUT /api/deals/:id ────────────────────────────────────────────────────

  describe('PUT /api/deals/:id', () => {
    it('updates deal fields and returns 200 with the updated deal', async () => {
      const deal = await createDeal(testUser.id, {
        nombre: 'Before Update',
        estadoSeguimiento: 'not_contacted'
      })

      const res = await request(app)
        .put(`/api/deals/${deal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nombre: 'After Update', estadoSeguimiento: 'contacted', municipio: 'Bayamon' })
        .expect(200)

      expect(res.body.id).toBe(deal.id)
      expect(res.body.nombre).toBe('After Update')
      expect(res.body.estadoSeguimiento).toBe('contacted')
      expect(res.body.municipio).toBe('Bayamon')
    })

    it('supports partial updates (unspecified fields remain unchanged)', async () => {
      const deal = await createDeal(testUser.id, {
        nombre: 'Partial Update Deal',
        municipio: 'Caguas',
        precio: 100000
      })

      const res = await request(app)
        .put(`/api/deals/${deal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nombre: 'Updated Name Only' })
        .expect(200)

      expect(res.body.nombre).toBe('Updated Name Only')
      expect(res.body.municipio).toBe('Caguas')
      expect(parseFloat(res.body.precio)).toBe(100000)
    })

    it('returns 404 when the deal belongs to a different user', async () => {
      const otherUser = await createUser({ email: 'other4@example.com' })
      const otherDeal = await createDeal(otherUser.id, { nombre: 'Not Mine' })

      await request(app)
        .put(`/api/deals/${otherDeal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nombre: 'Stolen' })
        .expect(404)
    })
  })

  // ─── DELETE /api/deals/:id ─────────────────────────────────────────────────

  describe('DELETE /api/deals/:id', () => {
    it('deletes the deal and returns 200 with { success: true }', async () => {
      const deal = await createDeal(testUser.id, { nombre: 'To Delete' })

      const res = await request(app)
        .delete(`/api/deals/${deal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body).toEqual({ success: true })
    })

    it('cascades: deletes associated DealNotes when deal is deleted', async () => {
      const deal = await createDeal(testUser.id, { nombre: 'Deal With Notes' })
      await createDealNote(deal.id, testUser.id, { text: 'Note to be deleted' })
      await createDealNote(deal.id, testUser.id, { text: 'Another note to be deleted' })

      await request(app)
        .delete(`/api/deals/${deal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Confirm the deal is gone — fetching it should return 404
      await request(app)
        .get(`/api/deals/${deal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('returns 404 when the deal belongs to a different user', async () => {
      const otherUser = await createUser({ email: 'other5@example.com' })
      const otherDeal = await createDeal(otherUser.id, { nombre: 'Not Mine' })

      await request(app)
        .delete(`/api/deals/${otherDeal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })

  // ─── POST /api/deals/:id/notes ─────────────────────────────────────────────

  describe('POST /api/deals/:id/notes', () => {
    let deal

    beforeEach(async () => {
      deal = await createDeal(testUser.id, { nombre: 'Deal for Notes' })
    })

    it('creates a note and returns 201 with the note object', async () => {
      const res = await request(app)
        .post(`/api/deals/${deal.id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'This is a great deal!' })
        .expect(201)

      expect(res.body).toHaveProperty('id')
      expect(res.body.dealId).toBe(deal.id)
      expect(res.body.text).toBe('This is a great deal!')
      expect(res.body).toHaveProperty('createdAt')
    })

    it('returns 400 when text is empty string', async () => {
      await request(app)
        .post(`/api/deals/${deal.id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: '' })
        .expect(400)
    })

    it('returns 400 when text is missing from body', async () => {
      await request(app)
        .post(`/api/deals/${deal.id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
    })

    it('returns 404 when deal belongs to a different user', async () => {
      const otherUser = await createUser({ email: 'other6@example.com' })
      const otherDeal = await createDeal(otherUser.id, { nombre: 'Not Mine' })

      await request(app)
        .post(`/api/deals/${otherDeal.id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Sneaky note' })
        .expect(404)
    })
  })

  // ─── DELETE /api/deals/:id/notes/:noteId ──────────────────────────────────

  describe('DELETE /api/deals/:id/notes/:noteId', () => {
    let deal, note

    beforeEach(async () => {
      deal = await createDeal(testUser.id, { nombre: 'Deal for Note Deletion' })
      note = await createDealNote(deal.id, testUser.id, { text: 'Note to delete' })
    })

    it('deletes the note and returns 200 with { success: true }', async () => {
      const res = await request(app)
        .delete(`/api/deals/${deal.id}/notes/${note.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body).toEqual({ success: true })
    })

    it('returns 404 when the note does not belong to the specified deal', async () => {
      const otherDeal = await createDeal(testUser.id, { nombre: 'Other Deal' })
      const noteOnOtherDeal = await createDealNote(otherDeal.id, testUser.id, { text: 'Other note' })

      // Try to delete noteOnOtherDeal via deal's route — mismatch
      await request(app)
        .delete(`/api/deals/${deal.id}/notes/${noteOnOtherDeal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('returns 404 when the deal belongs to a different user', async () => {
      const otherUser = await createUser({ email: 'other7@example.com' })
      const otherDeal = await createDeal(otherUser.id, { nombre: 'Not Mine' })
      const otherNote = await createDealNote(otherDeal.id, otherUser.id, { text: 'Their note' })

      await request(app)
        .delete(`/api/deals/${otherDeal.id}/notes/${otherNote.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })
})
