const Counter = require('../models/Counter');

const getNextSequence = async (name, prefix = '') => {
  const year = new Date().getFullYear();
  const key = `${name}_${year}`;

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 }, $setOnInsert: { prefix, year } },
    { new: true, upsert: true }
  );

  const padded = String(counter.seq).padStart(5, '0');
  return `${prefix}${year}/${padded}`;
};

const generateSinNo = () => getNextSequence('sinNo', 'SIN/');
const generateLabNo = () => getNextSequence('labNo', 'LAB/');
const generateInvoiceNo = () => getNextSequence('invoiceNo', 'INV/');
const generateULRNo = () => getNextSequence('ulrNo', 'ULR/');

module.exports = {
  generateSinNo,
  generateLabNo,
  generateInvoiceNo,
  generateULRNo,
  getNextSequence,
};
