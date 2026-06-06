const mongoose = require('mongoose');

const companyHolidaySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanyHoliday', companyHolidaySchema);
