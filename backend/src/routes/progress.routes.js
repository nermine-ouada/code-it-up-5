const express = require("express");
const {
  getAllProgress,
  getProgress,
  createProgress,
  updateProgress,
  addFeedback,
  getDashboardStats,
} = require("../controllers/progress.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// All routes are protected
router.use(protect);

// Dashboard stats
router.route("/dashboard").get(getDashboardStats);

// Progress routes accessible to all authenticated users
router.route("/").get(getAllProgress);

router.route("/:id").get(getProgress).put(updateProgress);

// Routes only for teachers and admins
router.route("/").post(authorize("admin", "teacher"), createProgress);

router.route("/:id/feedback").post(authorize("admin", "teacher"), addFeedback);

module.exports = router;
