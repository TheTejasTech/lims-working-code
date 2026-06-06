const SampleInward = require('../models/SampleInward');
const Customer = require('../models/Customer');
const { generateSinNo, generateLabNo } = require('../utils/generateNumber');
const { canTransition } = require('../utils/statusTransition');
const { emitEvent } = require('../config/socket');

const calcTotalQuantity = (samples) =>
  (samples || [])
    .filter((s) => !s.isCancelled)
    .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

const calcAmounts = (body) => {
  const totalAmount = Number(body.totalAmount) || 0;
  const discountPercent = Number(body.discountPercent) || 0;
  const discountAmount = body.discountAmount ?? (totalAmount * discountPercent) / 100;
  const taxableAmount = totalAmount - discountAmount;
  const gstPercent = Number(body.gstPercent) || 18;
  const gstAmount = body.gstAmount ?? (taxableAmount * gstPercent) / 100;
  const amountPaid = Number(body.amountPaid) || 0;
  const balanceAmount = taxableAmount + gstAmount - amountPaid;
  return { totalAmount, discountPercent, discountAmount, taxableAmount, gstPercent, gstAmount, amountPaid, balanceAmount };
};

const assignLabNumbers = async (samples) => {
  const result = [];
  for (const s of samples || []) {
    if (s.labNo) {
      result.push(s);
    } else {
      const labNo = await generateLabNo();
      result.push({ ...s, labNo });
    }
  }
  return result;
};

const sortUrgentFirst = (items) =>
  [...items].sort((a, b) => (b.isExpress ? 1 : 0) - (a.isExpress ? 1 : 0));

// GET /api/samples
const getSamples = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.customerId) filter.customerId = req.query.customerId;
    if (req.query.isExpress === 'true') filter.isExpress = true;
    if (req.query.search) {
      filter.$or = [
        { sinNo: { $regex: req.query.search, $options: 'i' } },
        { referenceNo: { $regex: req.query.search, $options: 'i' } },
        { 'samples.labNo': { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [raw, total] = await Promise.all([
      SampleInward.find(filter)
        .populate('customerId', 'customerName alias isPremium premiumCustomer isBlocked')
        .populate('allottedTo', 'userName userInitial')
        .sort({ isExpress: -1, inwardDate: -1 })
        .skip(skip)
        .limit(limit),
      SampleInward.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: sortUrgentFirst(raw),
      pagination: { page, limit, total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/samples/pending
const getPendingSamples = async (req, res) => {
  req.query.status = req.query.status || 'inward';
  return getSamples(req, res);
};

// GET /api/samples/completed
const getCompletedSamples = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { status: { $in: ['dispatched', 'invoiced', 'approved'] } };
    const [data, total] = await Promise.all([
      SampleInward.find(filter)
        .populate('customerId', 'customerName alias')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      SampleInward.countDocuments(filter),
    ]);

    res.json({ success: true, data, pagination: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/samples/:id
const getSampleById = async (req, res) => {
  try {
    const sample = await SampleInward.findById(req.params.id)
      .populate('customerId')
      .populate('allottedTo', 'userName userInitial department')
      .populate('createdBy', 'userName');

    if (!sample) return res.status(404).json({ success: false, message: 'Sample not found' });
    res.json({ success: true, data: sample });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/samples
const createSample = async (req, res) => {
  try {
    const customer = await Customer.findById(req.body.customerId);
    if (!customer) return res.status(400).json({ success: false, message: 'Customer not found' });

    if (customer.isBlocked && !customer.isPremium && !customer.premiumCustomer) {
      return res.status(403).json({
        success: false,
        message: `Customer blocked: ${customer.blockReason || 'Credit hold'}`,
      });
    }

    const sinNo = await generateSinNo();
    const samples = await assignLabNumbers(req.body.samples || []);
    const amounts = calcAmounts(req.body);

    const sample = await SampleInward.create({
      ...req.body,
      sinNo,
      samples,
      totalQuantity: calcTotalQuantity(samples),
      createdBy: req.user._id,
      ...amounts,
    });

    const populated = await SampleInward.findById(sample._id)
      .populate('customerId', 'customerName alias')
      .populate('allottedTo', 'userName');

    emitEvent('new:sample', populated);
    if (populated.isExpress) emitEvent('urgent:sample', populated);

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/samples/:id
const updateSample = async (req, res) => {
  try {
    const existing = await SampleInward.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Sample not found' });

    if (req.body.status && !canTransition(existing.status, req.body.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition: ${existing.status} → ${req.body.status}`,
      });
    }

    const updates = { ...req.body };
    delete updates.sinNo;

    if (updates.samples) {
      updates.samples = await assignLabNumbers(updates.samples);
      updates.totalQuantity = calcTotalQuantity(updates.samples);
    }

    if (updates.totalAmount !== undefined) {
      Object.assign(updates, calcAmounts({ ...existing.toObject(), ...updates }));
    }

    const sample = await SampleInward.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('customerId', 'customerName alias')
      .populate('allottedTo', 'userName');

    if (req.body.status && req.body.status !== existing.status) {
      emitEvent('sample:status:change', { id: sample._id, sinNo: sample.sinNo, status: sample.status });
    }

    res.json({ success: true, data: sample });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/samples/:id
const deleteSample = async (req, res) => {
  try {
    const sample = await SampleInward.findById(req.params.id);
    if (!sample) return res.status(404).json({ success: false, message: 'Sample not found' });

    if (!['inward', 'cancelled'].includes(sample.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only inward or cancelled samples can be deleted',
      });
    }

    await sample.deleteOne();
    res.json({ success: true, message: 'Sample deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/samples/:id/attachments
const addAttachments = async (req, res) => {
  try {
    const sample = await SampleInward.findById(req.params.id);
    if (!sample) return res.status(404).json({ success: false, message: 'Sample not found' });

    const newAttachments = (req.files || []).map((f) => ({
      fileName: f.originalname,
      filePath: `/uploads/samples/attachments/${f.filename}`,
      description: req.body.description || '',
      type: req.body.type || 'electronic',
    }));

    sample.attachments.push(...newAttachments);
    await sample.save();

    res.json({ success: true, data: sample.attachments });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/samples/:id/label-print
const getLabelData = async (req, res) => {
  try {
    const sample = await SampleInward.findById(req.params.id).populate('customerId', 'customerName');
    if (!sample) return res.status(404).json({ success: false, message: 'Sample not found' });

    const { labNo } = req.query;
    const labels = (sample.samples || [])
      .filter((s) => !s.isCancelled && (!labNo || s.labNo === labNo))
      .map((s) => ({
        labNo: s.labNo,
        sinNo: sample.sinNo,
        sample: s.sample,
        materialType: s.materialType,
        customerName: sample.customerId?.customerName,
        isExpress: sample.isExpress,
        inwardDate: sample.inwardDate,
      }));

    res.json({ success: true, data: labels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSamples,
  getPendingSamples,
  getCompletedSamples,
  getSampleById,
  createSample,
  updateSample,
  deleteSample,
  addAttachments,
  getLabelData,
};
