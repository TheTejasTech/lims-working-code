const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { checkRole, checkPagePermission } = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(checkPagePermission('users', 'canView'), getUsers)
  .post(checkPagePermission('users', 'canAdd'), createUser);

router
  .route('/:id')
  .get(checkPagePermission('users', 'canView'), getUserById)
  .put(checkPagePermission('users', 'canEdit'), updateUser)
  .delete(checkPagePermission('users', 'canDelete'), deleteUser);

module.exports = router;
