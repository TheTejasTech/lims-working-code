const express = require('express');
const {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  addPerformanceLog,
} = require('../controllers/equipmentController');
const { protect } = require('../middleware/auth');
const { checkPagePermission } = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router
  .route('/')
  .get(checkPagePermission('equipment', 'canView'), getEquipment)
  .post(checkPagePermission('equipment', 'canAdd'), createEquipment);

router.post('/:id/performance', checkPagePermission('equipment', 'canEdit'), addPerformanceLog);

router
  .route('/:id')
  .get(checkPagePermission('equipment', 'canView'), getEquipmentById)
  .put(checkPagePermission('equipment', 'canEdit'), updateEquipment)
  .delete(checkPagePermission('equipment', 'canDelete'), deleteEquipment);

module.exports = router;
