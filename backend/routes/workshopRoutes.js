const express = require('express');
const { getWorkshopBoard, scanIn, scanOut, stampTransfer } = require('../controllers/workshopController');
const { protect } = require('../middleware/auth');
const { checkPagePermission } = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router.get('/', checkPagePermission('workshop', 'canView'), getWorkshopBoard);
router.post('/stamp-transfer', checkPagePermission('workshop', 'canEdit'), stampTransfer);
router.post('/:labNo/scan-in', checkPagePermission('workshop', 'canEdit'), scanIn);
router.post('/:labNo/scan-out', checkPagePermission('workshop', 'canEdit'), scanOut);

module.exports = router;
