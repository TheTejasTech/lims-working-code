const Invoice = require('../models/Invoice');
const SampleInward = require('../models/SampleInward');
const Customer = require('../models/Customer');
const TestPlan = require('../models/TestPlan');
const { generateInvoiceNo } = require('../utils/generateNumber');
const { calcGst } = require('../utils/gstCalculator');
const { emitEvent } = require('../config/socket');

const calcInvoiceTotals = (body, customer) => {
  const testLines = body.testLines || [];
  const subtotal = testLines.reduce((s, l) => s + (Number(l.amount) || Number(l.rate) * Number(l.quantity) || 0), 0);
  const discountAmount = body.discountApplicable
    ? body.discountAmount ?? (subtotal * (body.discountPercent || 0)) / 100
    : 0;
  const taxableAmount = subtotal - discountAmount;
  const extra = (body.additionalCharges || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const taxDetails = calcGst(
    taxableAmount + extra,
    customer?.state,
    process.env.COMPANY_STATE,
    body.gstPercent || 18,
    body.sezApplicable || customer?.sezApplicable
  );
  const grandTotal = taxableAmount + extra + taxDetails.totalTax;
  return { subtotal, discountAmount, taxableAmount, taxDetails, grandTotal, totalAmount: subtotal };
};

const getInvoices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.customerId) filter.customerId = req.query.customerId;

    const data = await Invoice.find(filter)
      .populate('customerId', 'customerName alias')
      .sort({ invoiceDate: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPendingInvoices = async (req, res) => {
  try {
    const samples = await SampleInward.find({
      status: 'approved',
      noBill: { $ne: true },
    })
      .populate('customerId', 'customerName')
      .select('sinNo customerId totalAmount status');

    const invoicedSinIds = await Invoice.distinct('sinIds');
    const flatIds = invoicedSinIds.flat().map(String);

    const pending = samples.filter((s) => !flatIds.includes(String(s._id)));
    res.json({ success: true, data: pending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('customerId');
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const buildLinesFromPlan = async (sinId) => {
  const plans = await TestPlan.find({ sinId, planStatus: 'planned' });
  const lines = [];
  plans.forEach((p) => {
    (p.generalTests || []).forEach((t) => {
      if (!t.isCancelled) {
        lines.push({
          testSample: p.labNo,
          test: t.testName,
          testCaption: t.testCaption,
          quantity: t.quantity || 1,
          rate: 0,
          amount: 0,
        });
      }
    });
  });
  return lines;
};

const createInvoice = async (req, res) => {
  try {
    const customer = await Customer.findById(req.body.customerId);
    if (!customer) return res.status(400).json({ success: false, message: 'Customer not found' });

    let testLines = req.body.testLines;
    if (!testLines?.length && req.body.sinId) {
      testLines = await buildLinesFromPlan(req.body.sinId);
    }

    const invoiceNo = await generateInvoiceNo();
    const totals = calcInvoiceTotals({ ...req.body, testLines }, customer);

    const invoice = await Invoice.create({
      ...req.body,
      testLines,
      invoiceNo,
      ...totals,
      customerAlias: customer.alias,
      gstNo: customer.gstNo,
      tallyLedgerName: customer.tallyLedgerName,
      sinIds: req.body.sinIds || (req.body.sinId ? [req.body.sinId] : []),
    });

    if (req.body.sinId) {
      await SampleInward.findByIdAndUpdate(req.body.sinId, { status: 'invoiced' });
    }

    emitEvent('invoice:ready', { invoiceNo, customerId: customer._id });
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    const customer = await Customer.findById(req.body.customerId || invoice.customerId);
    const totals = calcInvoiceTotals({ ...invoice.toObject(), ...req.body }, customer);
    const updated = await Invoice.findByIdAndUpdate(
      req.params.id,
      { ...req.body, ...totals },
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const approveInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const recordPayment = async (req, res) => {
  try {
    const { amount, date, mode, refNo, remarks } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });

    invoice.payments.push({ amount, date: date || new Date(), mode, refNo, remarks });
    const paid = invoice.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    invoice.paymentStatus =
      paid >= invoice.grandTotal ? 'paid' : paid > 0 ? 'partiallyPaid' : 'pending';
    await invoice.save();

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('customerId');
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({
      success: true,
      message: 'PDF generation — integrate PDFKit in production',
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendInvoiceEmail = async (req, res) => {
  res.json({ success: true, message: 'Email queued — configure Nodemailer in .env' });
};

module.exports = {
  getInvoices,
  getPendingInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  approveInvoice,
  recordPayment,
  getInvoicePdf,
  sendInvoiceEmail,
};
