const mongoose = require('mongoose');

const testLineSchema = new mongoose.Schema({
  labNo: String,
  itemDesc: String,
  testType: String,
  testPiece: String,
  draftTestName: String,
  testName: String,
  status: String,
  srNo: Number,
  pageBreak: { type: Boolean, default: false },
});

const approvalSchema = new mongoose.Schema(
  {
    sinId: { type: mongoose.Schema.Types.ObjectId, ref: 'SampleInward', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalDate: Date,
    resultsRemarksTemplate: String,
    resultRemarks: String,
    reportDate: Date,
    remarks: String,
    inAccreditationULRNo: String,
    lastReportDate: Date,
    isInAccreditationScope: { type: Boolean, default: true },
    lastRevision: { type: Number, default: 0 },
    revisionText: String,
    revisionReason: String,
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approveAndSendMail: { type: Boolean, default: false },
    testLines: [testLineSchema],
    rejectReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Approval', approvalSchema);
