const express = require('express');
const {
  getDispatches,
  getDispatchById,
  createDispatch,
  updateDispatch,
  sendNotification,
} = require('../controllers/dispatchController');
const { protect } = require('../middleware/auth');
const { checkPagePermission } = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router
  .route('/')
  .get(checkPagePermission('dispatch', 'canView'), getDispatches)
  .post(checkPagePermission('dispatch', 'canAdd'), createDispatch);

router.post('/:id/send-notification', checkPagePermission('dispatch', 'canEdit'), sendNotification);

router
  .route('/:id')
  .get(checkPagePermission('dispatch', 'canView'), getDispatchById)
  .put(checkPagePermission('dispatch', 'canEdit'), updateDispatch);

module.exports = router;
