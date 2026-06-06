const express = require('express');
const {
  getCompanyInfo,
  updateCompanyInfo,
  getHolidays,
  createHoliday,
  deleteHoliday,
  getRemarkTemplates,
  createRemarkTemplate,
  deleteRemarkTemplate,
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
const { checkPagePermission } = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router.get('/company', checkPagePermission('settings', 'canView'), getCompanyInfo);
router.put('/company', checkPagePermission('settings', 'canEdit'), updateCompanyInfo);

router
  .route('/holidays')
  .get(checkPagePermission('settings', 'canView'), getHolidays)
  .post(checkPagePermission('settings', 'canAdd'), createHoliday);
router.delete('/holidays/:id', checkPagePermission('settings', 'canDelete'), deleteHoliday);

router
  .route('/remark-templates')
  .get(checkPagePermission('settings', 'canView'), getRemarkTemplates)
  .post(checkPagePermission('settings', 'canAdd'), createRemarkTemplate);
router.delete('/remark-templates/:id', checkPagePermission('settings', 'canDelete'), deleteRemarkTemplate);

module.exports = router;
