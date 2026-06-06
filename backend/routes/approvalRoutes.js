const express = require('express');
const {
  getApprovals,
  getApprovalById,
  createApproval,
  approveRecord,
  rejectApproval,
  previewApproval,
} = require('../controllers/approvalController');
const { protect } = require('../middleware/auth');
const { checkPagePermission } = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router
  .route('/')
  .get(checkPagePermission('approvals', 'canView'), getApprovals)
  .post(checkPagePermission('approvals', 'canAdd'), createApproval);

router.get('/:id/preview', checkPagePermission('approvals', 'canView'), previewApproval);
router.post('/:id/approve', checkPagePermission('approvals', 'canEdit'), approveRecord);
router.post('/:id/reject', checkPagePermission('approvals', 'canEdit'), rejectApproval);

router.route('/:id').get(checkPagePermission('approvals', 'canView'), getApprovalById);

module.exports = router;
