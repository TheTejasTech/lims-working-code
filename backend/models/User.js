const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[a-zA-Z0-9_]+$/,
    },
    userName: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    userCategory: {
      type: String,
      enum: ['admin', 'standard'],
      default: 'standard',
    },
    department: { type: String, trim: true },
    emailId: { type: String, trim: true, lowercase: true },
    contactNo: { type: String, trim: true },
    designation: { type: String, trim: true },
    employeeId: { type: String, trim: true },
    profilePhoto: { type: String },
    remoteLogin: { type: Boolean, default: true },
    isDisabled: { type: Boolean, default: false },
    isSamplePrep: { type: Boolean, default: false },
    openDispatchRights: { type: Boolean, default: false },
    userInitial: { type: String, trim: true, maxlength: 5 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
