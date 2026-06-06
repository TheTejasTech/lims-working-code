const SampleInward = require('../models/SampleInward');
const TestResult = require('../models/TestResult');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Equipment = require('../models/Equipment');

const parseDateRange = (query) => {
  const from = query.from ? new Date(query.from) : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const to = query.to ? new Date(query.to) : new Date();
  to.setHours(23, 59, 59, 999);
  return { from, to };
};

const getDashboardKpis = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    const [
      samplesToday,
      samplesMonth,
      pendingInward,
      pendingPlan,
      pendingWorkshop,
      pendingTesting,
      pendingApproval,
      pendingInvoice,
      overdue,
      revenueMonth,
      topCustomer,
    ] = await Promise.all([
      SampleInward.countDocuments({ inwardDate: { $gte: todayStart } }),
      SampleInward.countDocuments({ inwardDate: { $gte: monthStart } }),
      SampleInward.countDocuments({ status: 'inward' }),
      SampleInward.countDocuments({ status: 'planned' }),
      SampleInward.countDocuments({ status: 'inWorkshop' }),
      SampleInward.countDocuments({ status: 'testing' }),
      SampleInward.countDocuments({ status: 'pendingApproval' }),
      SampleInward.countDocuments({ status: 'approved' }),
      SampleInward.countDocuments({
        reportExpectedDate: { $lt: new Date() },
        status: { $nin: ['dispatched', 'cancelled', 'invoiced'] },
      }),
      Invoice.aggregate([
        { $match: { invoiceDate: { $gte: monthStart }, paymentStatus: { $ne: 'pending' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      SampleInward.aggregate([
        { $match: { inwardDate: { $gte: monthStart } } },
        { $group: { _id: '$customerId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: '_id',
            as: 'customer',
          },
        },
      ]),
    ]);

    const pendingInvoiceAmount = await Invoice.aggregate([
      { $match: { paymentStatus: { $in: ['pending', 'partiallyPaid'] } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]);

    res.json({
      success: true,
      data: {
        samplesToday,
        samplesMonth,
        pipeline: {
          inward: pendingInward,
          planned: pendingPlan,
          workshop: pendingWorkshop,
          testing: pendingTesting,
          approval: pendingApproval,
          invoice: pendingInvoice,
        },
        overdueSamples: overdue,
        revenueMonth: revenueMonth[0]?.total || 0,
        pendingInvoiceAmount: pendingInvoiceAmount[0]?.total || 0,
        topCustomer: topCustomer[0]?.customer?.[0]?.customerName || '—',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDelayReport = async (req, res) => {
  const { from, to } = parseDateRange(req.query);
  const samples = await SampleInward.find({
    reportExpectedDate: { $lt: new Date(), $gte: from, $lte: to },
    status: { $nin: ['dispatched', 'cancelled'] },
  }).populate('customerId', 'customerName');
  res.json({ success: true, data: samples });
};

const getPendingTestsReport = async (req, res) => {
  const data = await TestResult.find({ status: 'pending' }).populate('sinId', 'sinNo');
  res.json({ success: true, data });
};

const getTopCustomersReport = async (req, res) => {
  const { from, to } = parseDateRange(req.query);
  const byQty = await SampleInward.aggregate([
    { $match: { inwardDate: { $gte: from, $lte: to } } },
    { $group: { _id: '$customerId', quantity: { $sum: '$totalQuantity' }, count: { $sum: 1 } } },
    { $sort: { quantity: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
  ]);
  const byAmount = await Invoice.aggregate([
    { $match: { invoiceDate: { $gte: from, $lte: to } } },
    { $group: { _id: '$customerId', amount: { $sum: '$grandTotal' } } },
    { $sort: { amount: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
  ]);
  res.json({ success: true, data: { byQuantity: byQty, byAmount } });
};

const getMachineAnalysis = async (req, res) => {
  const data = await Equipment.find({ isActive: true }).select(
    'equipmentName serialNo calibrationDueDate performanceLog'
  );
  res.json({ success: true, data });
};

const getLabRegister = async (req, res) => {
  const { from, to } = parseDateRange(req.query);
  const data = await SampleInward.find({ inwardDate: { $gte: from, $lte: to } })
    .populate('customerId', 'customerName')
    .sort({ inwardDate: 1 });
  res.json({ success: true, data });
};

const getFinancialReport = async (req, res) => {
  const { from, to } = parseDateRange(req.query);
  const invoices = await Invoice.find({ invoiceDate: { $gte: from, $lte: to } });
  const invoiced = invoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
  const collected = invoices.reduce(
    (s, i) => s + (i.payments || []).reduce((p, pay) => p + (pay.amount || 0), 0),
    0
  );
  res.json({
    success: true,
    data: { invoiced, collected, outstanding: invoiced - collected, count: invoices.length },
  });
};

const getBusinessSummary = async (req, res) => {
  const { from, to } = parseDateRange(req.query);
  const [samples, customers, results] = await Promise.all([
    SampleInward.countDocuments({ inwardDate: { $gte: from, $lte: to } }),
    Customer.countDocuments({ createdAt: { $gte: from, $lte: to } }),
    TestResult.countDocuments({ createdAt: { $gte: from, $lte: to } }),
  ]);
  res.json({ success: true, data: { samples, newCustomers: customers, testsCompleted: results } });
};

module.exports = {
  getDashboardKpis,
  getDelayReport,
  getPendingTestsReport,
  getTopCustomersReport,
  getMachineAnalysis,
  getLabRegister,
  getFinancialReport,
  getBusinessSummary,
};
