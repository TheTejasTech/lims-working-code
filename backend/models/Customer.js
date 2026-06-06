const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    alias: { type: String, trim: true },
    legalName: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true, index: true },
    state: { type: String, trim: true, index: true },
    country: { type: String, trim: true, default: 'India' },
    pinCode: { type: String, trim: true },
    area: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    contactNo: { type: String, trim: true },
    emailId: { type: String, trim: true, lowercase: true },
    salutation: { type: String, trim: true },
    alternateAddress: { type: String, trim: true },
    alternateEmail: { type: String, trim: true, lowercase: true },
    alternateMobile: { type: String, trim: true },
    gstNo: { type: String, trim: true },
    gstNotApplicable: { type: Boolean, default: false },
    sezApplicable: { type: Boolean, default: false },
    creditLimit: { type: Number, default: 0 },
    creditDays: { type: Number, default: 0 },
    premiumCustomer: { type: Boolean, default: false },
    vendorCode: { type: String, trim: true },
    tallyLedgerName: { type: String, trim: true },
    salesPerson: { type: String, trim: true },
    industry: { type: String, trim: true, index: true },
    openingBalance: { type: Number, default: 0 },
    advanceDue: { type: Number, default: 0 },
    paymentTerms: { type: String, trim: true },
    isPremium: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String, trim: true },
    isDisabled: { type: Boolean, default: false },
    userLoginId: { type: String, trim: true, sparse: true },
    userLoginPassword: { type: String, select: false },
    currencyCode: { type: String, default: 'INR' },
    mergedInto: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  },
  { timestamps: true }
);

customerSchema.pre('save', async function (next) {
  if (!this.isModified('userLoginPassword') || !this.userLoginPassword) return next();
  this.userLoginPassword = await bcrypt.hash(this.userLoginPassword, 12);
  next();
});

customerSchema.index({ customerName: 'text', alias: 'text', legalName: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
