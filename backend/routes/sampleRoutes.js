const express = require("express");
const {
  getSamples,
  getPendingSamples,
  getCompletedSamples,
  getSampleById,
  createSample,
  updateSample,
  deleteSample,
  addAttachments,
  addSampleImages,
  getLabelData,
} = require("../controllers/sampleController");
const { protect } = require("../middleware/auth");
const { checkPagePermission } = require("../middleware/roleCheck");
const {
  uploadSampleAttachment,
  uploadSampleImage,
} = require("../middleware/upload");

const router = express.Router();

router.use(protect);

router.get(
  "/pending",
  checkPagePermission("samples", "canView"),
  getPendingSamples,
);
router.get(
  "/completed",
  checkPagePermission("samples", "canView"),
  getCompletedSamples,
);

router
  .route("/")
  .get(checkPagePermission("samples", "canView"), getSamples)
  .post(checkPagePermission("samples", "canAdd"), createSample);

router.get(
  "/:id/label-print",
  checkPagePermission("samples", "canView"),
  getLabelData,
);
router.post(
  "/:id/attachments",
  checkPagePermission("samples", "canEdit"),
  uploadSampleAttachment,
  addAttachments,
);
router.post(
  "/:id/sample-images",
  checkPagePermission("samples", "canEdit"),
  uploadSampleImage,
  addSampleImages,
);

router
  .route("/:id")
  .get(checkPagePermission("samples", "canView"), getSampleById)
  .put(checkPagePermission("samples", "canEdit"), updateSample)
  .delete(checkPagePermission("samples", "canDelete"), deleteSample);

module.exports = router;
