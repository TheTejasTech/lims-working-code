const mongoose = require('mongoose');

const specTestSchema = new mongoose.Schema(
  {
    testName: { type: String, required: true },
    testCaption: String,
    testType: { type: String, enum: ['mechanical', 'chemical', 'visual', 'calibration'], default: 'mechanical' },
    minValue: Number,
    maxValue: Number,
    unit: String,
    testMethod: String,
  },
  { _id: true }
);

const specificationSchema = new mongoose.Schema(
  {
    specCode: { type: String, required: true, unique: true, trim: true },
    specCaption: { type: String, required: true, trim: true },
    description: String,
    base: String,
    organisation: { type: String, trim: true },
    classificationCode: String,
    classificationValue: String,
    year: Number,
    otherIdentification: String,
    isFrozen: { type: Boolean, default: false },
    isDisabled: { type: Boolean, default: false },
    attachedFiles: [{ fileName: String, filePath: String }],
    testList: [specTestSchema],
  },
  { timestamps: true }
);

specificationSchema.index({ specCode: 'text', specCaption: 'text' });

module.exports = mongoose.model('Specification', specificationSchema);
