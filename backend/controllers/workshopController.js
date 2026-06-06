const WorkshopLog = require('../models/WorkshopLog');
const SampleInward = require('../models/SampleInward');
const { emitEvent } = require('../config/socket');

const getWorkshopBoard = async (req, res) => {
  try {
    const filter = { status: { $in: ['pending', 'inWorkshop', 'outForTesting'] } };
    const logs = await WorkshopLog.find(filter)
      .populate('sinId', 'sinNo isExpress customerId status')
      .populate('sampleInBy', 'userName')
      .populate('sampleOutBy', 'userName')
      .sort({ updatedAt: -1 });

    const enriched = await Promise.all(
      logs.map(async (log) => {
        const sample = await SampleInward.findById(log.sinId?._id || log.sinId)
          .populate('customerId', 'customerName')
          .select('sinNo isExpress customerId samples');
        return { ...log.toObject(), sample };
      })
    );

    enriched.sort((a, b) => (b.sample?.isExpress ? 1 : 0) - (a.sample?.isExpress ? 1 : 0));
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const scanIn = async (req, res) => {
  try {
    const { labNo } = req.params;
    const sample = await SampleInward.findOne({ 'samples.labNo': labNo });
    if (!sample) return res.status(404).json({ success: false, message: 'Lab No not found' });

    let log = await WorkshopLog.findOne({ labNo });
    if (!log) {
      log = await WorkshopLog.create({
        labNo,
        sinId: sample._id,
        isReturnable: sample.isReturnable,
        status: 'inWorkshop',
        sampleInTime: new Date(),
        sampleInBy: req.user._id,
      });
    } else {
      log.status = 'inWorkshop';
      log.sampleInTime = new Date();
      log.sampleInBy = req.user._id;
      await log.save();
    }

    await SampleInward.findByIdAndUpdate(sample._id, { status: 'inWorkshop' });
    const payload = { labNo, sinNo: sample.sinNo, isExpress: sample.isExpress, action: 'in' };
    emitEvent('workshop:scan', payload);

    res.json({ success: true, data: log, message: 'Sample scanned IN' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const scanOut = async (req, res) => {
  try {
    const { labNo } = req.params;
    const log = await WorkshopLog.findOne({ labNo });
    if (!log) return res.status(404).json({ success: false, message: 'No workshop record' });

    log.status = 'outForTesting';
    log.sampleOutTime = new Date();
    log.sampleOutBy = req.user._id;
    await log.save();

    const sample = await SampleInward.findById(log.sinId);
    if (sample) await SampleInward.findByIdAndUpdate(sample._id, { status: 'testing' });

    emitEvent('workshop:scan', { labNo, sinNo: sample?.sinNo, action: 'out' });
    res.json({ success: true, data: log, message: 'Sample scanned OUT' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const stampTransfer = async (req, res) => {
  try {
    const { labNo, fromDept, toDept, workshopRemarks } = req.body;
    const log = await WorkshopLog.findOne({ labNo });
    if (!log) return res.status(404).json({ success: false, message: 'Lab No not found' });

    log.stampTransferLog.push({
      fromDept,
      toDept,
      transferredBy: req.user._id,
    });
    if (workshopRemarks) log.workshopRemarks = workshopRemarks;
    await log.save();

    res.json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getWorkshopBoard, scanIn, scanOut, stampTransfer };
