const express = require('express');
const {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  getTestGroups,
  createTestGroup,
  updateTestGroup,
  deleteTestGroup,
} = require('../controllers/testMasterController');
const { protect } = require('../middleware/auth');
const { checkPagePermission } = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

router.get('/groups/list', checkPagePermission('tests', 'canView'), getTestGroups);
router.post('/groups', checkPagePermission('tests', 'canAdd'), createTestGroup);
router.put('/groups/:id', checkPagePermission('tests', 'canEdit'), updateTestGroup);
router.delete('/groups/:id', checkPagePermission('tests', 'canDelete'), deleteTestGroup);

router
  .route('/')
  .get(checkPagePermission('tests', 'canView'), getTests)
  .post(checkPagePermission('tests', 'canAdd'), createTest);

router
  .route('/:id')
  .get(checkPagePermission('tests', 'canView'), getTestById)
  .put(checkPagePermission('tests', 'canEdit'), updateTest)
  .delete(checkPagePermission('tests', 'canDelete'), deleteTest);

module.exports = router;
