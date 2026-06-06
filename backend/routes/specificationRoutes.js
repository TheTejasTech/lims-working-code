const express = require('express');
const {
  getSpecifications,
  getSpecificationById,
  createSpecification,
  updateSpecification,
  deleteSpecification,
  saveAsNew,
  addTestToSpec,
} = require('../controllers/specificationController');
const { protect } = require('../middleware/auth');
const { checkPagePermission } = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router
  .route('/')
  .get(checkPagePermission('specifications', 'canView'), getSpecifications)
  .post(checkPagePermission('specifications', 'canAdd'), createSpecification);

router.post('/:id/save-as-new', checkPagePermission('specifications', 'canAdd'), saveAsNew);
router.post('/:id/tests', checkPagePermission('specifications', 'canEdit'), addTestToSpec);

router
  .route('/:id')
  .get(checkPagePermission('specifications', 'canView'), getSpecificationById)
  .put(checkPagePermission('specifications', 'canEdit'), updateSpecification)
  .delete(checkPagePermission('specifications', 'canDelete'), deleteSpecification);

module.exports = router;
