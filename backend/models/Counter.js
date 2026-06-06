const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  prefix: String,
  year: Number,
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
