const express = require("express");
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// All routes are protected and restricted to admin
router.use(protect);
router.use(authorize("admin"));

router.route("/").get(getAllUsers).post(createUser);

router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;
