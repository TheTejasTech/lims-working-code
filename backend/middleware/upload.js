const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = process.env.UPLOAD_PATH || './uploads';

const ensureDir = (subdir) => {
  const dir = path.join(uploadDir, subdir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const storage = (subdir) =>
  multer.diskStorage({
    destination: (req, file, cb) => cb(null, ensureDir(subdir)),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype) || file.mimetype === 'application/pdf';
  if (ext || mime) cb(null, true);
  else cb(new Error('File type not allowed'), false);
};

const uploadSampleAttachment = multer({
  storage: storage('samples/attachments'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
}).array('files', 10);

const uploadSampleImage = multer({
  storage: storage('samples/images'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).array('images', 5);

module.exports = { uploadSampleAttachment, uploadSampleImage, ensureDir };
