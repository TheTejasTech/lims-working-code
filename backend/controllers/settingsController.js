const CompanyInfo = require('../models/CompanyInfo');
const CompanyHoliday = require('../models/CompanyHoliday');
const RemarkTemplate = require('../models/RemarkTemplate');

const getCompanyInfo = async (req, res) => {
  let info = await CompanyInfo.findOne();
  if (!info) {
    info = await CompanyInfo.create({
      name: 'Material Testing Laboratory',
      state: process.env.COMPANY_STATE || 'Maharashtra',
    });
  }
  res.json({ success: true, data: info });
};

const updateCompanyInfo = async (req, res) => {
  let info = await CompanyInfo.findOne();
  if (!info) info = await CompanyInfo.create(req.body);
  else {
    Object.assign(info, req.body);
    await info.save();
  }
  res.json({ success: true, data: info });
};

const getHolidays = async (req, res) => {
  const data = await CompanyHoliday.find().sort({ date: 1 });
  res.json({ success: true, data });
};

const createHoliday = async (req, res) => {
  const holiday = await CompanyHoliday.create(req.body);
  res.status(201).json({ success: true, data: holiday });
};

const deleteHoliday = async (req, res) => {
  await CompanyHoliday.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
};

const getRemarkTemplates = async (req, res) => {
  const data = await RemarkTemplate.find().sort({ templateName: 1 });
  res.json({ success: true, data });
};

const createRemarkTemplate = async (req, res) => {
  const t = await RemarkTemplate.create(req.body);
  res.status(201).json({ success: true, data: t });
};

const deleteRemarkTemplate = async (req, res) => {
  await RemarkTemplate.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
};

module.exports = {
  getCompanyInfo,
  updateCompanyInfo,
  getHolidays,
  createHoliday,
  deleteHoliday,
  getRemarkTemplates,
  createRemarkTemplate,
  deleteRemarkTemplate,
};
