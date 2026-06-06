require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const customerRoutes = require('./routes/customerRoutes');
const sampleRoutes = require('./routes/sampleRoutes');
const specificationRoutes = require('./routes/specificationRoutes');
const testMasterRoutes = require('./routes/testMasterRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const testPlanRoutes = require('./routes/testPlanRoutes');
const workshopRoutes = require('./routes/workshopRoutes');
const resultRoutes = require('./routes/resultRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const server = http.createServer(app);

initSocket(server);
app.set('trust proxy', 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const uploadPath = process.env.UPLOAD_PATH || './uploads';
app.use('/uploads', express.static(path.resolve(uploadPath)));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'LIMS API is running', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/samples', sampleRoutes);
app.use('/api/specifications', specificationRoutes);
app.use('/api/tests', testMasterRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/plans', testPlanRoutes);
app.use('/api/workshop', workshopRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`LIMS server running on port ${PORT}`);
  });
});

module.exports = { app, server };
