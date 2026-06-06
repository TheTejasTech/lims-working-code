const express = require('express');
const {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getSystemPages,
} = require('../controllers/roleController');
const { protect } = require('../middleware/auth');
const { checkPagePermission } = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

router.get('/pages/list', checkPagePermission('roles', 'canView'), getSystemPages);

router
  .route('/')
  .get(checkPagePermission('roles', 'canView'), getRoles)
  .post(checkPagePermission('roles', 'canAdd'), createRole);

router
  .route('/:id')
  .get(checkPagePermission('roles', 'canView'), getRoleById)
  .put(checkPagePermission('roles', 'canEdit'), updateRole)
  .delete(checkPagePermission('roles', 'canDelete'), deleteRole);

module.exports = router;
