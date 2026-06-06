const TestResult = require('../models/TestResult');
const TestPlan = require('../models/TestPlan');
const SampleInward = require('../models/SampleInward');
const Specification = require('../models/Specification');
const { evaluateFormula, validateAgainstSpec } = require('../utils/formulaEngine');

const computePassFail = (resultDetails) => {
  if (!resultDetails?.length) return 'pending';
  const hasFail = resultDetails.some((d) => d.failFlag);
  const allFilled = resultDetails.every((d) => d.result !== '' && d.result != null);
  if (!allFilled) return 'pending';
  return hasFail ? 'fail' : 'pass';
};

const applyFormulasAndValidation = async (body) => {
  const details = [...(body.resultDetails || [])];
  let specTests = [];
  if (body.specification) {
    const spec = await Specification.findById(body.specification);
    specTests = spec?.testList || [];
  }

  details.forEach((d, i) => {
    const specTest = specTests.find((t) => t.testName === d.testParameter || t.testCaption === d.testParameter);
    const min = d.minimumReq ?? specTest?.minValue;
    const max = d.maximumReq ?? specTest?.maxValue;
    if (d.result != null && d.result !== '') {
      const v = validateAgainstSpec(d.result, min, max);
      details[i] = { ...d, minimumReq: min, maximumReq: max, failFlag: v.failFlag };
    }
  });

  const overallPassFail = computePassFail(details);
  const autoRemarks =
    overallPassFail === 'pass'
      ? 'Results conform to specification requirements.'
      : overallPassFail === 'fail'
        ? 'One or more parameters do not meet specification requirements.'
        : '';

  return { ...body, resultDetails: details, overallPassFail, autoRemarks };
};

const getResults = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.labNo) filter.labNo = req.query.labNo;
    if (req.query.sinId) filter.sinId = req.query.sinId;

    const data = await TestResult.find(filter)
      .populate('sinId', 'sinNo isExpress')
      .populate('testPerformedBy', 'userName userInitial')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPendingResults = async (req, res) => {
  req.query.status = 'pending';
  return getResults(req, res);
};

const getResultsByLabNo = async (req, res) => {
  req.query.labNo = req.params.labNo;
  return getResults(req, res);
};

const getResultById = async (req, res) => {
  try {
    const result = await TestResult.findById(req.params.id)
      .populate('specification')
      .populate('equipmentSerialNo')
      .populate('testPerformedBy', 'userName');
    if (!result) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createResult = async (req, res) => {
  try {
    let body = await applyFormulasAndValidation({
      ...req.body,
      testPerformedBy: req.user._id,
      status: 'completed',
      dateOfCompletion: new Date(),
    });

    const result = await TestResult.create(body);

    const pending = await TestResult.countDocuments({
      sinId: body.sinId,
      status: { $in: ['pending'] },
    });
    const total = await TestResult.countDocuments({ sinId: body.sinId });
    const completed = await TestResult.countDocuments({
      sinId: body.sinId,
      status: { $in: ['completed', 'approved'] },
    });

    if (completed > 0 && pending === 0) {
      await SampleInward.findByIdAndUpdate(body.sinId, { status: 'pendingApproval' });
    } else {
      await SampleInward.findByIdAndUpdate(body.sinId, { status: 'testing' });
    }

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateResult = async (req, res) => {
  try {
    const existing = await TestResult.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
    if (existing.isLocked) {
      return res.status(400).json({ success: false, message: 'Result is locked after approval' });
    }

    let body = await applyFormulasAndValidation({ ...existing.toObject(), ...req.body });
    const result = await TestResult.findByIdAndUpdate(req.params.id, body, { new: true });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const pullEquipmentData = async (req, res) => {
  res.json({
    success: true,
    message: 'Equipment integration placeholder — connect instrument API here',
    data: { resultDetails: req.body.resultDetails || [] },
  });
};

const createFromPlan = async (req, res) => {
  try {
    const { labNo, sinId } = req.body;
    const plan = await TestPlan.findOne({ labNo, sinId });
    if (!plan) return res.status(404).json({ success: false, message: 'Test plan not found' });

    const created = [];
    for (const t of plan.generalTests || []) {
      if (t.isCancelled) continue;
      const exists = await TestResult.findOne({ labNo, sinId, testName: t.testName });
      if (exists) continue;
      const r = await TestResult.create({
        labNo,
        sinId,
        testPlanId: plan._id,
        testName: t.testName,
        testCaption: t.testCaption,
        testMethod: t.testMethod,
        specification: plan.testSpecification,
        status: 'pending',
        resultDetails: [{ testParameter: t.testName, result: '' }],
      });
      created.push(r);
    }
    res.status(201).json({ success: true, data: created, count: created.length });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getResults,
  getPendingResults,
  getResultsByLabNo,
  getResultById,
  createResult,
  updateResult,
  pullEquipmentData,
  createFromPlan,
};
