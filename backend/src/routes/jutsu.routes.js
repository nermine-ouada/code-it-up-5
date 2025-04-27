const express = require("express");
const {
  getAllJutsu,
  getJutsu,
  createJutsu,
  updateJutsu,
  deleteJutsu,
} = require("../controllers/jutsu.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes accessible to all authenticated users
router.route("/").get(getAllJutsu);

router.route("/:id").get(getJutsu);

// Routes only for teachers and admins
router.route("/").post(authorize("admin", "teacher"), createJutsu);

router
  .route("/:id")
  .put(authorize("admin", "teacher"), updateJutsu)
  .delete(authorize("admin", "teacher"), deleteJutsu);

module.exports = router;
