const Role = require('../models/Role');
const User = require('../models/User');
const { buildDefaultPages, SYSTEM_PAGES } = require('../../shared/constants');

// GET /api/roles
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ roleName: 1 });
    res.json({ success: true, count: roles.length, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/roles/pages — list available system pages
const getSystemPages = async (req, res) => {
  res.json({ success: true, data: SYSTEM_PAGES });
};

// GET /api/roles/:id
const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/roles
const createRole = async (req, res) => {
  try {
    const { roleName, roleDescription, dashboard, pages } = req.body;

    const exists = await Role.findOne({ roleName });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Role name already exists' });
    }

    const role = await Role.create({
      roleName,
      roleDescription,
      dashboard: dashboard || '/dashboard',
      pages: pages || buildDefaultPages(),
    });

    res.status(201).json({ success: true, data: role });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/roles/:id
const updateRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, data: role });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/roles/:id
const deleteRole = async (req, res) => {
  try {
    const usersWithRole = await User.countDocuments({ role: req.params.id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role — ${usersWithRole} user(s) assigned`,
      });
    }

    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getSystemPages,
};
