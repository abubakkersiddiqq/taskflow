const express = require("express");
const { body } = require("express-validator");
const { getTasks, createTask, updateTask, deleteTask } = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All task routes are protected
router.use(protect);

router.route("/")
  .get(getTasks)
  .post(
    [body("title").notEmpty().withMessage("Title is required")],
    createTask
  );

router.route("/:id")
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
