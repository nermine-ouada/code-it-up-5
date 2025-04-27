const Assignment = require("../models/Assignment");
const User = require("../models/User");


exports.getAssignments = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "teacher") {
      query.createdBy = req.user.id;
    }
    else if (req.user.role === "student") {
      query.assignedTo = req.user.id;
    }

    if (req.query.active === "true") {
      query.isActive = true;
    } else if (req.query.active === "false") {
      query.isActive = false;
    }

    const assignments = await Assignment.find(query)
      .populate("createdBy", "firstName lastName username")
      .populate("assignedTo", "firstName lastName username");

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("createdBy", "firstName lastName username")
      .populate("assignedTo", "firstName lastName username")
      .populate("submissions.student", "firstName lastName username");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      assignment.createdBy._id.toString() !== req.user.id &&
      !assignment.assignedTo.some(
        (student) => student._id.toString() === req.user.id
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this assignment",
      });
    }

    res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;

    if (req.body.assignedTo && req.body.assignedTo.length > 0) {
      const students = await User.find({
        _id: { $in: req.body.assignedTo },
        role: "student",
      });

      if (students.length !== req.body.assignedTo.length) {
        return res.status(400).json({
          success: false,
          message: "One or more assigned student IDs are invalid",
        });
      }
    }

    const assignment = await Assignment.create(req.body);

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    let assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      assignment.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this assignment",
      });
    }

    if (req.body.assignedTo && req.body.assignedTo.length > 0) {
      const students = await User.find({
        _id: { $in: req.body.assignedTo },
        role: "student",
      });

      if (students.length !== req.body.assignedTo.length) {
        return res.status(400).json({
          success: false,
          message: "One or more assigned student IDs are invalid",
        });
      }
    }

    assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Make sure user is assignment owner or admin
    if (
      req.user.role !== "admin" &&
      assignment.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this assignment",
      });
    }

    await assignment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (!assignment.isActive) {
      return res.status(400).json({
        success: false,
        message: "This assignment is no longer active",
      });
    }

    if (new Date(assignment.dueDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "The due date for this assignment has passed",
      });
    }

    if (!assignment.assignedTo.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this assignment",
      });
    }

    const existingSubmission = assignment.submissions.find(
      (submission) => submission.student.toString() === req.user.id
    );

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted this assignment",
      });
    }

    assignment.submissions.push({
      student: req.user.id,
      content: req.body.content,
      submittedAt: Date.now(),
    });

    await assignment.save();

    res.status(200).json({
      success: true,
      message: "Assignment submitted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// /api/assignments/:id/grade/:submissionId
exports.gradeSubmission = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      assignment.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to grade this assignment",
      });
    }

    const submission = assignment.submissions.id(req.params.submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    // Update submission
    submission.grade = req.body.grade;
    submission.feedback = req.body.feedback;
    submission.isGraded = true;

    await assignment.save();

    res.status(200).json({
      success: true,
      message: "Submission graded successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
