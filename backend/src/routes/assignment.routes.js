const express = require("express");
const {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission,
} = require("../controllers/assignment.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.route("/").get(getAssignments);

router.route("/:id").get(getAssignment);

router.route("/").post(authorize("admin", "teacher"), createAssignment);

router
  .route("/:id")
  .put(authorize("admin", "teacher"), updateAssignment)
  .delete(authorize("admin", "teacher"), deleteAssignment);

router.route("/:id/submit").post(authorize("student"), submitAssignment);
router
  .route("/:id/grade/:submissionId")
  .put(authorize("admin", "teacher"), gradeSubmission);

module.exports = router;
