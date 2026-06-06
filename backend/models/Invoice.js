const mongoose = require('mongoose');

const testLineSchema = new mongoose.Schema({
  testSample: String,
  test: String,
  testCaption: String,
  element: String,
  quantity: { type: Number, default: 1 },
  rate: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  pageBreak: { type: Boolean, default: false },
  nonDiscount: { type: Boolean, default: false },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    invoiceDate: { type: Date, default: Date.now },
    invoiceType: { type: String, default: 'standard' },
    performaInvoiceNo: String,
    performaInvoiceDate: Date,
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerAlias: String,
    reportIssuedTo: String,
    contactPerson: String,
    telNo: String,
    faxNo: String,
    address: String,
    emailId: String,
    labRefNo: String,
    refChallanNo: String,
    vendorCode: String,
    accountantName: String,
    paymentTerms: String,
    dueDate: Date,
    tallyLedgerName: String,
    gstNo: String,
    testLines: [testLineSchema],
    totalAmount: { type: Number, default: 0 },
    discountApplicable: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxDetails: {
      sgst: { type: Number, default: 0 },
      cgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
      notApplicable: { type: Boolean, default: false },
    },
    sezApplicable: { type: Boolean, default: false },
    additionalCharges: [{ description: String, amount: Number }],
    narration: String,
    remarks: String,
    uploadedFiles: [{ fileName: String, filePath: String }],
    isMultipleChallan: { type: Boolean, default: false },
    sinIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SampleInward' }],
    paymentStatus: {
      type: String,
      enum: ['pending', 'partiallyPaid', 'paid'],
      default: 'pending',
    },
    payments: [
      {
        amount: Number,
        date: Date,
        mode: String,
        refNo: String,
        remarks: String,
      },
    ],
    isApproved: { type: Boolean, default: false },
    isPerforma: { type: Boolean, default: false },
    exportableReport: { type: Boolean, default: true },
    grandTotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
