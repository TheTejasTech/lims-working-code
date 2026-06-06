const mongoose = require('mongoose');
const { buildDefaultPages } = require('../../shared/constants');

const pagePermissionSchema = new mongoose.Schema(
  {
    pageName: { type: String, required: true },
    canView: { type: Boolean, default: false },
    canAdd: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    roleName: { type: String, required: true, unique: true, trim: true },
    roleDescription: { type: String, trim: true },
    dashboard: { type: String, default: '/dashboard' },
    pages: {
      type: [pagePermissionSchema],
      default: buildDefaultPages,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
