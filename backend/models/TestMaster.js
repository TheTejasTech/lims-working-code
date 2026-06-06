const mongoose = require('mongoose');

const parameterSchema = new mongoose.Schema(
  {
    paramName: { type: String, required: true },
    sysCode: { type: String, required: true },
    unit: String,
    formula: String,
    displayOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const testMasterSchema = new mongoose.Schema(
  {
    testCode: { type: String, required: true, unique: true, trim: true },
    testName: { type: String, required: true, trim: true },
    testCaption: String,
    testType: {
      type: String,
      enum: ['mechanical', 'chemical', 'visual', 'calibration'],
      default: 'mechanical',
    },
    department: String,
    parameters: [parameterSchema],
    defaultMethod: String,
    accreditationScope: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestMaster', testMasterSchema);
