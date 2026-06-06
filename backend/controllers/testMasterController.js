const TestMaster = require('../models/TestMaster');
const TestGroup = require('../models/TestGroup');

const getTests = async (req, res) => {
  try {
    const { search, testType, department, isActive } = req.query;
    const filter = {};
    if (testType) filter.testType = testType;
    if (department) filter.department = new RegExp(department, 'i');
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { testCode: { $regex: search, $options: 'i' } },
        { testName: { $regex: search, $options: 'i' } },
        { testCaption: { $regex: search, $options: 'i' } },
      ];
    }
    const data = await TestMaster.find(filter).sort({ testCode: 1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTestById = async (req, res) => {
  try {
    const test = await TestMaster.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTest = async (req, res) => {
  try {
    const test = await TestMaster.create(req.body);
    res.status(201).json({ success: true, data: test });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateTest = async (req, res) => {
  try {
    const test = await TestMaster.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!test) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteTest = async (req, res) => {
  try {
    const test = await TestMaster.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!test) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Test Groups
const getTestGroups = async (req, res) => {
  try {
    const data = await TestGroup.find().populate('tests.test', 'testCode testName testCaption defaultMethod');
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTestGroup = async (req, res) => {
  try {
    const group = await TestGroup.create(req.body);
    const populated = await TestGroup.findById(group._id).populate('tests.test', 'testCode testName');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateTestGroup = async (req, res) => {
  try {
    const group = await TestGroup.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('tests.test', 'testCode testName testCaption defaultMethod');
    if (!group) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: group });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteTestGroup = async (req, res) => {
  try {
    await TestGroup.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Test group deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  getTestGroups,
  createTestGroup,
  updateTestGroup,
  deleteTestGroup,
};
