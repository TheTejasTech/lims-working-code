const mongoose = require('mongoose');

const generalTestSchema = new mongoose.Schema({
  testPiece: String,
  testName: String,
  testCaption: String,
  testMethod: String,
  otherInstruction: String,
  quantity: { type: Number, default: 1 },
  pageBreak: { type: Boolean, default: false },
  isCancelled: { type: Boolean, default: false },
});

const chemicalTestSchema = new mongoose.Schema({
  testPiece: String,
  chemicalGroup: String,
  testMethodName: String,
  isSpectroAnalysis: { type: Boolean, default: false },
  isWetAnalysis: { type: Boolean, default: false },
  elements: [{ name: String, minValue: Number, maxValue: Number }],
  pageBreak: { type: Boolean, default: false },
  isCancelled: { type: Boolean, default: false },
});

const testPlanSchema = new mongoose.Schema(
  {
    sinId: { type: mongoose.Schema.Types.ObjectId, ref: 'SampleInward', required: true },
    labNo: { type: String, required: true },
    testSpecification: { type: mongoose.Schema.Types.ObjectId, ref: 'Specification' },
    testSpecification2: { type: mongoose.Schema.Types.ObjectId, ref: 'Specification' },
    base: String,
    base2: String,
    testGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'TestGroup' },
    officeInstruction: String,
    sampleCondition: String,
    sampleNature: String,
    reportPrefix: String,
    generalTests: [generalTestSchema],
    chemicalTests: [chemicalTestSchema],
    planStatus: { type: String, enum: ['draft', 'planned'], default: 'draft' },
    canPlanMultipleSamples: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestPlan', testPlanSchema);
