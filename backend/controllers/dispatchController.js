const Dispatch = require('../models/Dispatch');
const SampleInward = require('../models/SampleInward');
const Invoice = require('../models/Invoice');

const getDispatches = async (req, res) => {
  try {
    const data = await Dispatch.find()
      .populate('sinId', 'sinNo isReturnable customerId')
      .populate('dispatchedBy', 'userName')
      .sort({ dispatchDate: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDispatchById = async (req, res) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id)
      .populate('sinId')
      .populate('invoiceId');
    if (!dispatch) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: dispatch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createDispatch = async (req, res) => {
  try {
    const sample = await SampleInward.findById(req.body.sinId);
    if (!sample) return res.status(404).json({ success: false, message: 'Sample not found' });

    const dispatch = await Dispatch.create({
      ...req.body,
      labNos: req.body.labNos || sample.samples.map((s) => s.labNo),
      returnSample: sample.isReturnable,
      dispatchedBy: req.user._id,
    });

    await SampleInward.findByIdAndUpdate(req.body.sinId, { status: 'dispatched' });

    res.status(201).json({
      success: true,
      data: dispatch,
      returnableAlert: sample.isReturnable
        ? 'Returnable sample — ensure balance material is sent to customer'
        : null,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateDispatch = async (req, res) => {
  try {
    const dispatch = await Dispatch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dispatch) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: dispatch });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const sendNotification = async (req, res) => {
  res.json({
    success: true,
    message: 'Notification sent (email/SMS — configure in production)',
  });
};

module.exports = {
  getDispatches,
  getDispatchById,
  createDispatch,
  updateDispatch,
  sendNotification,
};
