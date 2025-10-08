const express = require('express');
const integrationController = require('../controllers/integrationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes (for OAuth callbacks)
router.get('/airbnb/callback', integrationController.airbnbCallback);

// Protected routes
router.use(authenticate);

// Get all integrations
router.get('/', integrationController.getIntegrations);

// Airbnb OAuth
router.post('/airbnb/connect', integrationController.connectAirbnb);
router.post('/airbnb/disconnect', integrationController.disconnectAirbnb);

// VRBO OAuth (to be implemented)
router.post('/vrbo/connect', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/vrbo/disconnect', (req, res) => res.status(501).json({ message: 'Not implemented' }));

// Booking.com (to be implemented)
router.post('/booking-com/connect', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/booking-com/disconnect', (req, res) => res.status(501).json({ message: 'Not implemented' }));

// iCal sync (to be implemented)
router.post('/ical', (req, res) => res.status(501).json({ message: 'Not implemented' }));

// Integration management
router.get('/:id/status', integrationController.getIntegrationStatus);
router.put('/:id', integrationController.updateIntegration);
router.post('/:id/sync', integrationController.syncIntegration);

module.exports = router;
