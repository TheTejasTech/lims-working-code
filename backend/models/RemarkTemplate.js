const mongoose = require('mongoose');

const remarkTemplateSchema = new mongoose.Schema(
  {
    templateName: { type: String, required: true, unique: true },
    remarkText: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RemarkTemplate', remarkTemplateSchema);
