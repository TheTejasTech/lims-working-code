const mongoose = require('mongoose');

const dispatchSchema = new mongoose.Schema(
  {
    sinId: { type: mongoose.Schema.Types.ObjectId, ref: 'SampleInward', required: true },
    invoiceNo: { type: String },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    labNos: [String],
    dispatchMode: {
      type: String,
      enum: ['byCourier', 'byHand', 'byEmail'],
      default: 'byHand',
    },
    dispatchDate: { type: Date, default: Date.now },
    courierName: String,
    employeeName: String,
    docketNo: String,
    contactNo: String,
    remarks: String,
    returnSample: { type: Boolean, default: false },
    returnDate: Date,
    returnSampleReceivedBy: String,
    testPieceQuantity: Number,
    isOpen: { type: Boolean, default: false },
    sendMail: { type: Boolean, default: false },
    sendSMS: { type: Boolean, default: false },
    dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dispatch', dispatchSchema);
