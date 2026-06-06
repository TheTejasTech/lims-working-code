const Approval = require('../models/Approval');
const TestResult = require('../models/TestResult');
const SampleInward = require('../models/SampleInward');
const { generateULRNo } = require('../utils/generateNumber');
const { emitEvent } = require('../config/socket');

const getApprovals = async (req, res) => {
  try {
    const filter = {};
    if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;
    const data = await Approval.find(filter)
      .populate('sinId', 'sinNo customerId isExpress status')
      .populate('approvedBy', 'userName userInitial')
      .sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getApprovalById = async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.id)
      .populate({ path: 'sinId', populate: { path: 'customerId', select: 'customerName address' } })
      .populate('approvedBy', 'userName');
    if (!approval) return res.status(404).json({ success: false, message: 'Not found' });

    const results = await TestResult.find({ sinId: approval.sinId._id || approval.sinId });
    res.json({ success: true, data: approval, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createApproval = async (req, res) => {
  try {
    const sample = await SampleInward.findById(req.body.sinId);
    if (!sample) return res.status(404).json({ success: false, message: 'Sample not found' });

    const results = await TestResult.find({ sinId: req.body.sinId, status: 'completed' });
    const testLines = (req.body.testLines || results).map((r, i) => ({
      labNo: r.labNo,
      testName: r.testName || r.testName,
      draftTestName: r.testName,
      itemDesc: r.testCaption,
      status: r.overallPassFail || r.status,
      srNo: r.srNo ?? i + 1,
    }));

    const approval = await Approval.create({
      ...req.body,
      testLines,
      approvalStatus: 'pending',
    });

    emitEvent('approval:ready', { sinId: sample._id, sinNo: sample.sinNo });
    res.status(201).json({ success: true, data: approval });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const approveRecord = async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.id);
    if (!approval) return res.status(404).json({ success: false, message: 'Not found' });

    const ulrNo = approval.inAccreditationULRNo || (await generateULRNo());

    approval.approvalStatus = 'approved';
    approval.approvedBy = req.user._id;
    approval.approvalDate = new Date();
    approval.reportDate = req.body.reportDate || new Date();
    approval.inAccreditationULRNo = ulrNo;
    approval.resultRemarks = req.body.resultRemarks || approval.resultRemarks;
    approval.approveAndSendMail = req.body.approveAndSendMail || false;
    await approval.save();

    await TestResult.updateMany(
      { sinId: approval.sinId },
      { status: 'approved', isLocked: true }
    );

    await SampleInward.findByIdAndUpdate(approval.sinId, { status: 'approved' });

    res.json({
      success: true,
      data: approval,
      message: approval.approveAndSendMail
        ? 'Approved — email dispatch queued (configure Nodemailer)'
        : 'Approved successfully',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const rejectApproval = async (req, res) => {
  try {
    const approval = await Approval.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: 'rejected',
        rejectReason: req.body.rejectReason,
        approvedBy: req.user._id,
        approvalDate: new Date(),
      },
      { new: true }
    );
    if (!approval) return res.status(404).json({ success: false, message: 'Not found' });

    await TestResult.updateMany(
      { sinId: approval.sinId, isLocked: false },
      { status: 'rejected', isLocked: false }
    );
    await SampleInward.findByIdAndUpdate(approval.sinId, { status: 'testing' });

    res.json({ success: true, data: approval });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const previewApproval = async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.id).populate('sinId');
    if (!approval) return res.status(404).json({ success: false, message: 'Not found' });

    const results = await TestResult.find({ sinId: approval.sinId }).populate('specification', 'specCode specCaption');
    res.json({
      success: true,
      preview: {
        approval,
        results,
        ulrNo: approval.inAccreditationULRNo,
        reportDate: approval.reportDate || new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getApprovals,
  getApprovalById,
  createApproval,
  approveRecord,
  rejectApproval,
  previewApproval,
};
