const mongoose = require('mongoose');

const workshopLogSchema = new mongoose.Schema(
  {
    labNo: { type: String, required: true, index: true },
    sinId: { type: mongoose.Schema.Types.ObjectId, ref: 'SampleInward', required: true },
    sampleInTime: Date,
    sampleInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sampleOutTime: Date,
    sampleOutBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'inWorkshop', 'outForTesting', 'completed'],
      default: 'pending',
    },
    stampTransferLog: [
      {
        fromDept: String,
        toDept: String,
        transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        transferTime: { type: Date, default: Date.now },
      },
    ],
    isReturnable: { type: Boolean, default: false },
    workshopRemarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkshopLog', workshopLogSchema);
