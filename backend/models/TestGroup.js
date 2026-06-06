const mongoose = require('mongoose');

const testGroupSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true, unique: true, trim: true },
    tests: [
      {
        test: { type: mongoose.Schema.Types.ObjectId, ref: 'TestMaster' },
        caption: String,
        method: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestGroup', testGroupSchema);
