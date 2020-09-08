const express = require('express');
const extractMP3 = require('../middleware/extractMP3');
const checkAuthentication = require('../middleware/checkAuthentication');

const sermonsController = require('../controllers/sermons');

const router = express.Router();

router.post('', checkAuthentication, extractMP3, sermonsController.createSermon);
router.put('/:id', checkAuthentication, extractMP3, sermonsController.updateSermon);
router.get('', sermonsController.getSermons);
router.get('/:id', sermonsController.getSermon);
router.delete('/:id', checkAuthentication, sermonsController.deleteSermon);
router.get('/limit/:number', sermonsController.getLimitedSermons);

module.exports = router;