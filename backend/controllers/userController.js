const User = require('../models/User');

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const { search, department, userCategory } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (userCategory) filter.userCategory = userCategory;
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { emailId: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('role', 'roleName roleDescription dashboard')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('role');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/users
const createUser = async (req, res) => {
  try {
    const {
      userId,
      userName,
      password,
      role,
      userCategory,
      department,
      emailId,
      contactNo,
      designation,
      employeeId,
      profilePhoto,
      remoteLogin,
      isDisabled,
      isSamplePrep,
      openDispatchRights,
      userInitial,
    } = req.body;

    const exists = await User.findOne({ userId });
    if (exists) {
      return res.status(400).json({ success: false, message: 'User ID already exists' });
    }

    const user = await User.create({
      userId,
      userName,
      password,
      role,
      userCategory: userCategory || 'standard',
      department,
      emailId,
      contactNo,
      designation,
      employeeId,
      profilePhoto,
      remoteLogin: remoteLogin !== false,
      isDisabled: isDisabled || false,
      isSamplePrep: isSamplePrep || false,
      openDispatchRights: openDispatchRights || false,
      userInitial,
    });

    const populated = await User.findById(user._id)
      .select('-password')
      .populate('role');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.userId;

    if (updates.password === '' || updates.password === undefined) {
      delete updates.password;
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    Object.assign(user, updates);
    await user.save();

    const populated = await User.findById(user._id)
      .select('-password')
      .populate('role');

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
