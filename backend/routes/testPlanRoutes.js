const express = require('express');
const {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  bulkPlan,
} = require('../controllers/testPlanController');
const { protect } = require('../middleware/auth');
const { checkPagePermission } = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router.post('/bulk', checkPagePermission('plans', 'canAdd'), bulkPlan);

router
  .route('/')
  .get(checkPagePermission('plans', 'canView'), getPlans)
  .post(checkPagePermission('plans', 'canAdd'), createPlan);

router
  .route('/:id')
  .get(checkPagePermission('plans', 'canView'), getPlanById)
  .put(checkPagePermission('plans', 'canEdit'), updatePlan)
  .delete(checkPagePermission('plans', 'canDelete'), deletePlan);

module.exports = router;
