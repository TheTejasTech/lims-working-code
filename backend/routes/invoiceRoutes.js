const express = require('express');
const {
  getInvoices,
  getPendingInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  approveInvoice,
  recordPayment,
  getInvoicePdf,
  sendInvoiceEmail,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const { checkPagePermission } = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router.get('/pending', checkPagePermission('invoices', 'canView'), getPendingInvoices);

router
  .route('/')
  .get(checkPagePermission('invoices', 'canView'), getInvoices)
  .post(checkPagePermission('invoices', 'canAdd'), createInvoice);

router.post('/:id/approve', checkPagePermission('invoices', 'canEdit'), approveInvoice);
router.post('/:id/send-email', checkPagePermission('invoices', 'canEdit'), sendInvoiceEmail);
router.post('/:id/record-payment', checkPagePermission('invoices', 'canEdit'), recordPayment);
router.get('/:id/pdf', checkPagePermission('invoices', 'canView'), getInvoicePdf);

router
  .route('/:id')
  .get(checkPagePermission('invoices', 'canView'), getInvoiceById)
  .put(checkPagePermission('invoices', 'canEdit'), updateInvoice);

module.exports = router;
