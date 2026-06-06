const express = require('express');
const {
  getDashboardKpis,
  getDelayReport,
  getPendingTestsReport,
  getTopCustomersReport,
  getMachineAnalysis,
  getLabRegister,
  getFinancialReport,
  getBusinessSummary,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { checkPagePermission } = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router.get('/dashboard/kpis', checkPagePermission('dashboard', 'canView'), getDashboardKpis);
router.get('/delay', checkPagePermission('reports', 'canView'), getDelayReport);
router.get('/pending-tests', checkPagePermission('reports', 'canView'), getPendingTestsReport);
router.get('/top-customers', checkPagePermission('reports', 'canView'), getTopCustomersReport);
router.get('/machine-analysis', checkPagePermission('reports', 'canView'), getMachineAnalysis);
router.get('/lab-register', checkPagePermission('reports', 'canView'), getLabRegister);
router.get('/financial', checkPagePermission('reports', 'canView'), getFinancialReport);
router.get('/business-summary', checkPagePermission('reports', 'canView'), getBusinessSummary);

module.exports = router;
