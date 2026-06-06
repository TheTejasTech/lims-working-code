const Equipment = require('../models/Equipment');

const getEquipment = async (req, res) => {
  try {
    const { search, department, calibrationDue } = req.query;
    const filter = {};
    if (department) filter.department = new RegExp(department, 'i');
    if (search) {
      filter.$or = [
        { equipmentName: { $regex: search, $options: 'i' } },
        { serialNo: { $regex: search, $options: 'i' } },
        { modelNo: { $regex: search, $options: 'i' } },
      ];
    }
    if (calibrationDue === 'true') {
      filter.calibrationDueDate = { $lte: new Date() };
      filter.isActive = true;
    }

    const data = await Equipment.find(filter).sort({ equipmentName: 1 });
    const enriched = data.map((e) => {
      const doc = e.toObject();
      doc.calibrationOverdue =
        e.calibrationDueDate && new Date(e.calibrationDueDate) < new Date();
      return doc;
    });
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEquipmentById = async (req, res) => {
  try {
    const eq = await Equipment.findById(req.params.id).populate('performanceLog.performedBy', 'userName');
    if (!eq) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: eq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createEquipment = async (req, res) => {
  try {
    const eq = await Equipment.create(req.body);
    res.status(201).json({ success: true, data: eq });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateEquipment = async (req, res) => {
  try {
    const eq = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!eq) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: eq });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteEquipment = async (req, res) => {
  try {
    const eq = await Equipment.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!eq) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: eq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addPerformanceLog = async (req, res) => {
  try {
    const eq = await Equipment.findById(req.params.id);
    if (!eq) return res.status(404).json({ success: false, message: 'Not found' });
    eq.performanceLog.push({ ...req.body, performedBy: req.user._id });
    await eq.save();
    res.json({ success: true, data: eq });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  addPerformanceLog,
};
