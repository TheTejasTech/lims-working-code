const Customer = require('../models/Customer');
const SampleInward = require('../models/SampleInward');

const buildFilter = (query) => {
  const filter = { $or: [{ mergedInto: null }, { mergedInto: { $exists: false } }] };
  const { search, state, city, industry, isBlocked, isPremium, isDisabled } = query;

  if (state) filter.state = new RegExp(state, 'i');
  if (city) filter.city = new RegExp(city, 'i');
  if (industry) filter.industry = new RegExp(industry, 'i');
  if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';
  if (isPremium !== undefined) filter.isPremium = isPremium === 'true';
  if (isDisabled !== undefined) filter.isDisabled = isDisabled === 'true';

  if (search) {
    filter.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { alias: { $regex: search, $options: 'i' } },
      { legalName: { $regex: search, $options: 'i' } },
      { contactNo: { $regex: search, $options: 'i' } },
      { emailId: { $regex: search, $options: 'i' } },
      { vendorCode: { $regex: search, $options: 'i' } },
    ];
  }

  return filter;
};

// GET /api/customers
const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const filter = buildFilter(req.query);

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ customerName: 1 }).skip(skip).limit(limit),
      Customer.countDocuments(filter),
    ]);

    res.json({ success: true, data: customers, pagination: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/customers/:id
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/customers
const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.mergedInto;

    const customer = await Customer.findById(req.params.id).select('+userLoginPassword');
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    if (updates.userLoginPassword === '' || updates.userLoginPassword === undefined) {
      delete updates.userLoginPassword;
    }

    Object.assign(customer, updates);
    await customer.save();

    const result = await Customer.findById(customer._id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/customers/:id
const deleteCustomer = async (req, res) => {
  try {
    const sampleCount = await SampleInward.countDocuments({ customerId: req.params.id });
    if (sampleCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — ${sampleCount} sample record(s) linked`,
      });
    }

    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/customers/merge
const mergeCustomers = async (req, res) => {
  try {
    const { primaryId, duplicateIds, reason } = req.body;

    if (!primaryId || !duplicateIds?.length) {
      return res.status(400).json({
        success: false,
        message: 'primaryId and duplicateIds[] required',
      });
    }

    const primary = await Customer.findById(primaryId);
    if (!primary) return res.status(404).json({ success: false, message: 'Primary customer not found' });

    await SampleInward.updateMany(
      { customerId: { $in: duplicateIds } },
      { $set: { customerId: primaryId } }
    );

    await Customer.updateMany(
      { _id: { $in: duplicateIds } },
      {
        $set: {
          mergedInto: primaryId,
          isDisabled: true,
          blockReason: reason || `Merged into ${primary.customerName}`,
        },
      }
    );

    res.json({
      success: true,
      message: `Merged ${duplicateIds.length} customer(s) into ${primary.customerName}`,
      data: primary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/customers/:id/block
const blockCustomer = async (req, res) => {
  try {
    const { isBlocked, blockReason } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isBlocked: isBlocked !== false, blockReason },
      { new: true }
    );
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/customers/:id/dashboard
const getCustomerDashboard = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const openStatuses = ['inward', 'planned', 'inWorkshop', 'testing', 'pendingApproval', 'approved'];

    const [openJobs, pendingInvoices, recentSamples] = await Promise.all([
      SampleInward.find({
        customerId,
        status: { $in: openStatuses },
      })
        .sort({ isExpress: -1, inwardDate: -1 })
        .limit(50)
        .select('sinNo status inwardDate isExpress reportExpectedDate totalAmount balanceAmount'),
      SampleInward.find({
        customerId,
        status: 'approved',
        noBill: false,
        balanceAmount: { $gt: 0 },
      })
        .sort({ inwardDate: -1 })
        .limit(20)
        .select('sinNo balanceAmount totalAmount status'),
      SampleInward.find({ customerId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('customerId', 'customerName'),
    ]);

    const paymentDue = pendingInvoices.reduce((sum, s) => sum + (s.balanceAmount || 0), 0);
    const creditExceeded =
      !customer.isPremium &&
      !customer.premiumCustomer &&
      customer.creditLimit > 0 &&
      paymentDue > customer.creditLimit;

    res.json({
      success: true,
      data: {
        customer,
        openJobs,
        openJobsCount: openJobs.length,
        pendingInvoices,
        paymentDue,
        creditExceeded,
        creditLimit: customer.creditLimit,
        creditDays: customer.creditDays,
        recentSamples,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  mergeCustomers,
  blockCustomer,
  getCustomerDashboard,
};
