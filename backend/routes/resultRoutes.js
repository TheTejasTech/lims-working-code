const express = require('express');
const {
  getResults,
  getPendingResults,
  getResultsByLabNo,
  getResultById,
  createResult,
  updateResult,
  pullEquipmentData,
  createFromPlan,
} = require('../controllers/resultController');
const { protect } = require('../middleware/auth');
const { checkPagePermission } = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router.get('/pending', checkPagePermission('results', 'canView'), getPendingResults);
router.post('/from-plan', checkPagePermission('results', 'canAdd'), createFromPlan);
router.get('/by-labno/:labNo', checkPagePermission('results', 'canView'), getResultsByLabNo);

router
  .route('/')
  .get(checkPagePermission('results', 'canView'), getResults)
  .post(checkPagePermission('results', 'canAdd'), createResult);

router.post('/:id/pull-equipment-data', checkPagePermission('results', 'canEdit'), pullEquipmentData);

router
  .route('/:id')
  .get(checkPagePermission('results', 'canView'), getResultById)
  .put(checkPagePermission('results', 'canEdit'), updateResult);

module.exports = router;
