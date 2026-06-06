const Specification = require('../models/Specification');

const getSpecifications = async (req, res) => {
  try {
    const { search, organisation, isDisabled } = req.query;
    const filter = {};
    if (organisation) filter.organisation = new RegExp(organisation, 'i');
    if (isDisabled !== undefined) filter.isDisabled = isDisabled === 'true';
    if (search) {
      filter.$or = [
        { specCode: { $regex: search, $options: 'i' } },
        { specCaption: { $regex: search, $options: 'i' } },
        { classificationValue: { $regex: search, $options: 'i' } },
      ];
    }
    const data = await Specification.find(filter).sort({ specCode: 1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSpecificationById = async (req, res) => {
  try {
    const spec = await Specification.findById(req.params.id);
    if (!spec) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: spec });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSpecification = async (req, res) => {
  try {
    const spec = await Specification.create(req.body);
    res.status(201).json({ success: true, data: spec });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateSpecification = async (req, res) => {
  try {
    const existing = await Specification.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
    if (existing.isFrozen) {
      return res.status(400).json({ success: false, message: 'Specification is frozen — cannot edit' });
    }
    const spec = await Specification.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: spec });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteSpecification = async (req, res) => {
  try {
    const spec = await Specification.findByIdAndUpdate(
      req.params.id,
      { isDisabled: true },
      { new: true }
    );
    if (!spec) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Specification disabled', data: spec });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/specifications/:id/save-as-new
const saveAsNew = async (req, res) => {
  try {
    const source = await Specification.findById(req.params.id).lean();
    if (!source) return res.status(404).json({ success: false, message: 'Not found' });

    const { specCode, specCaption } = req.body;
    if (!specCode || !specCaption) {
      return res.status(400).json({ success: false, message: 'New specCode and specCaption required' });
    }

    delete source._id;
    delete source.createdAt;
    delete source.updatedAt;
    source.specCode = specCode;
    source.specCaption = specCaption;
    source.isFrozen = false;
    source.isDisabled = false;

    const spec = await Specification.create(source);
    res.status(201).json({ success: true, data: spec });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/specifications/:id/tests
const addTestToSpec = async (req, res) => {
  try {
    const spec = await Specification.findById(req.params.id);
    if (!spec) return res.status(404).json({ success: false, message: 'Not found' });
    if (spec.isFrozen) {
      return res.status(400).json({ success: false, message: 'Specification is frozen' });
    }
    spec.testList.push(req.body);
    await spec.save();
    res.json({ success: true, data: spec });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSpecifications,
  getSpecificationById,
  createSpecification,
  updateSpecification,
  deleteSpecification,
  saveAsNew,
  addTestToSpec,
};
