const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    equipmentName: { type: String, required: true, trim: true },
    serialNo: { type: String, required: true, unique: true, trim: true },
    modelNo: String,
    department: String,
    location: String,
    calibrationDueDate: Date,
    lastCalibrationDate: Date,
    calibrationCertNo: String,
    isActive: { type: Boolean, default: true },
    performanceLog: [
      {
        date: { type: Date, default: Date.now },
        result: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Equipment', equipmentSchema);
