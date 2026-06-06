const express = require('express');
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  mergeCustomers,
  blockCustomer,
  getCustomerDashboard,
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');
const { checkPagePermission } = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

router.post('/merge', checkPagePermission('customers', 'canEdit'), mergeCustomers);

router
  .route('/')
  .get(checkPagePermission('customers', 'canView'), getCustomers)
  .post(checkPagePermission('customers', 'canAdd'), createCustomer);

router.get('/:id/dashboard', checkPagePermission('customers', 'canView'), getCustomerDashboard);
router.patch('/:id/block', checkPagePermission('customers', 'canEdit'), blockCustomer);

router
  .route('/:id')
  .get(checkPagePermission('customers', 'canView'), getCustomerById)
  .put(checkPagePermission('customers', 'canEdit'), updateCustomer)
  .delete(checkPagePermission('customers', 'canDelete'), deleteCustomer);

module.exports = router;
