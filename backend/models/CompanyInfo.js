const mongoose = require('mongoose');

const companyInfoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: String,
    city: String,
    state: { type: String, default: 'Maharashtra' },
    pinCode: String,
    phone: String,
    email: String,
    website: String,
    gstNo: String,
    accreditationNo: String,
    logo: String,
    bankDetails: {
      bankName: String,
      accountNo: String,
      ifsc: String,
      branch: String,
    },
    authorizedSignatories: [{ name: String, designation: String, signatureImage: String }],
    sinLabel: { type: String, default: 'Sample Inward No' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanyInfo', companyInfoSchema);
