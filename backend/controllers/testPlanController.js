const TestPlan = require('../models/TestPlan');
const SampleInward = require('../models/SampleInward');
const Specification = require('../models/Specification');
const TestGroup = require('../models/TestGroup');

const populateFromSpec = (spec) => ({
  generalTests: (spec.testList || [])
    .filter((t) => t.testType !== 'chemical')
    .map((t) => ({
      testName: t.testName,
      testCaption: t.testCaption,
      testMethod: t.testMethod,
      quantity: 1,
    })),
  chemicalTests: (spec.testList || [])
    .filter((t) => t.testType === 'chemical')
    .map((t) => ({
      chemicalGroup: t.testName,
      testMethodName: t.testMethod,
      elements: [{ name: t.testName, minValue: t.minValue, maxValue: t.maxValue }],
    })),
});

const populateFromGroup = async (groupId) => {
  const group = await TestGroup.findById(groupId).populate('tests.test');
  if (!group) return { generalTests: [], chemicalTests: [] };
  return {
    generalTests: group.tests.map((t) => ({
      testName: t.test?.testName,
      testCaption: t.caption || t.test?.testCaption,
      testMethod: t.method || t.test?.defaultMethod,
      quantity: 1,
    })),
    chemicalTests: [],
  };
};

const getPlans = async (req, res) => {
  try {
    const filter = {};
    if (req.query.sinId) filter.sinId = req.query.sinId;
    if (req.query.labNo) filter.labNo = req.query.labNo;
    if (req.query.planStatus) filter.planStatus = req.query.planStatus;

    const data = await TestPlan.find(filter)
      .populate('sinId', 'sinNo isExpress status')
      .populate('testSpecification', 'specCode specCaption')
      .populate('testGroup', 'groupName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPlanById = async (req, res) => {
  try {
    const plan = await TestPlan.findById(req.params.id)
      .populate('sinId')
      .populate('testSpecification')
      .populate('testSpecification2')
      .populate('testGroup');
    if (!plan) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPlan = async (req, res) => {
  try {
    let body = { ...req.body, createdBy: req.user._id };

    if (body.testSpecification && !body.generalTests?.length) {
      const spec = await Specification.findById(body.testSpecification);
      if (spec) Object.assign(body, populateFromSpec(spec));
    }
    if (body.testGroup && !body.generalTests?.length) {
      Object.assign(body, await populateFromGroup(body.testGroup));
    }

    const plan = await TestPlan.create(body);

    if (body.planStatus === 'planned') {
      await SampleInward.findByIdAndUpdate(body.sinId, { status: 'planned' });
    }

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const plan = await TestPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Not found' });

    if (req.body.planStatus === 'planned') {
      await SampleInward.findByIdAndUpdate(plan.sinId, { status: 'planned' });
    }
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deletePlan = async (req, res) => {
  try {
    await TestPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Plan deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/plans/bulk
const bulkPlan = async (req, res) => {
  try {
    const { sinId, labNos, ...planData } = req.body;
    if (!sinId || !labNos?.length) {
      return res.status(400).json({ success: false, message: 'sinId and labNos[] required' });
    }

    let template = { ...planData, sinId, createdBy: req.user._id, canPlanMultipleSamples: true };
    if (planData.testSpecification) {
      const spec = await Specification.findById(planData.testSpecification);
      if (spec) Object.assign(template, populateFromSpec(spec));
    }

    const plans = await Promise.all(
      labNos.map((labNo) => TestPlan.create({ ...template, labNo }))
    );

    await SampleInward.findByIdAndUpdate(sinId, { status: 'planned' });
    res.status(201).json({ success: true, data: plans });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getPlans, getPlanById, createPlan, updatePlan, deletePlan, bulkPlan };
