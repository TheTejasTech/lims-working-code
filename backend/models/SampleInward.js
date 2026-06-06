const mongoose = require("mongoose");
const { SAMPLE_STATUSES, RECEIPT_MODES } = require("../../shared/constants");

const sampleDetailSchema = new mongoose.Schema({
  labNo: { type: String, required: true },
  sample: { type: String, trim: true },
  materialType: { type: String, trim: true },
  materialSpecification: { type: String, trim: true },
  sampleIdentification: { type: String, trim: true },
  sizeRange: { type: String, trim: true },
  remarks: { type: String, trim: true },
  quantity: { type: Number, default: 1 },
  testTypeIdentifier: { type: String, trim: true },
  isCancelled: { type: Boolean, default: false },
  sampleImages: [{ fileName: String, filePath: String }],
  batchNo: { type: String, trim: true },
  partNo: { type: String, trim: true },
  additionalDetails: { type: String, trim: true },
});

const attachmentSchema = new mongoose.Schema(
  {
    fileName: String,
    filePath: String,
    description: String,
    type: {
      type: String,
      enum: ["electronic", "physical"],
      default: "electronic",
    },
  },
  { _id: true },
);

const reviewSchema = new mongoose.Schema(
  {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewDate: Date,
    comments: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { _id: false },
);

const sampleInwardSchema = new mongoose.Schema(
  {
    sinNo: { type: String, required: true, unique: true },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    inwardDate: { type: Date, default: Date.now },
    inwardTime: { type: String },
    reportIssuedTo: { type: String, trim: true },
    reportIssuedToAddress: { type: String, trim: true },
    referenceNo: { type: String, trim: true },
    referenceDate: { type: Date },
    challanNumber: { type: String, trim: true },
    challanDate: { type: Date },
    poNumber: { type: String, trim: true },
    poNo: { type: String, trim: true },
    poDate: { type: Date },
    allottedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    customerRemarks: { type: String, trim: true },
    sampleCollectedBy: { type: String, trim: true },
    jobOrderRef: { type: String, trim: true },
    isExpress: { type: Boolean, default: false },
    totalQuantity: { type: Number, default: 0 },
    witnessedBy: { type: String, trim: true },
    witnessEmail: { type: String, trim: true },
    forTesting: { type: Boolean, default: true },
    forCalibration: { type: Boolean, default: false },
    suppressEmail: { type: Boolean, default: false },
    status: {
      type: String,
      enum: SAMPLE_STATUSES,
      default: "inward",
      index: true,
    },
    holdReason: { type: String },
    cancelReason: { type: String },
    samples: [sampleDetailSchema],
    attachments: [attachmentSchema],
    sampleAdditionalDetails: [{ description: String, value: String }],
    deviation: {
      damage: { type: Boolean, default: false },
      sizeNotMentioned: { type: Boolean, default: false },
      quantityInsufficient: { type: Boolean, default: false },
      improperStamp: { type: Boolean, default: false },
      testDetailNotProvided: { type: Boolean, default: false },
    },
    deviationChecklist: [
      {
        description: { type: String, trim: true },
        status: {
          type: String,
          enum: ["OK", "Deviation", "N/A"],
          default: "OK",
        },
        remarks: { type: String, trim: true },
      },
    ],
    sampleCondition: { type: String, trim: true },
    sampleNature: { type: String, trim: true },
    isReturnable: { type: Boolean, default: false },
    isNonReturnable: { type: Boolean, default: false },
    inAccreditationScope: { type: Boolean, default: true },
    isWitnessRequired: { type: Boolean, default: false },
    isReadySample: { type: Boolean, default: false },
    noBill: { type: Boolean, default: false },
    totalAmount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 18 },
    gstAmount: { type: Number, default: 0 },
    paymentMode: { type: String, trim: true },
    paymentRefNo: { type: String, trim: true },
    paymentRemarks: { type: String, trim: true },
    amountPaid: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    reportExpectedDate: { type: Date },
    receiptMode: { type: String, enum: RECEIPT_MODES, default: "byHand" },
    humidity: { type: String },
    temperature: { type: String },
    technicalReview: reviewSchema,
    businessReview: reviewSchema,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

sampleInwardSchema.index({ sinNo: 1 });
sampleInwardSchema.index(
  { "samples.labNo": 1 },
  { unique: true, sparse: true },
);
sampleInwardSchema.index({ isExpress: 1, status: 1 });

module.exports = mongoose.model("SampleInward", sampleInwardSchema);
