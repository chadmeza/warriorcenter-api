const express = require('express');
const checkAuthentication = require('../middleware/checkAuthentication');

const eventsController = require('../controllers/events');

const router = express.Router();

router.post('', checkAuthentication, eventsController.createEvent);
router.put('/:id', checkAuthentication, eventsController.updateEvent);
router.get('', eventsController.getEvents);
router.get('/:id', eventsController.getEvent);
router.delete('/:id', checkAuthentication, eventsController.deleteEvent);
router.get('/limit/:number', eventsController.getLimitedEvents);
router.delete('/delete/old', checkAuthentication, eventsController.deleteOldEvents);

module.exports = router;