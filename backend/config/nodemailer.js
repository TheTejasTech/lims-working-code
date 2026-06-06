/** Nodemailer config — wired in Phase 3 for report/invoice emails */

const getMailerConfig = () => ({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = { getMailerConfig };
