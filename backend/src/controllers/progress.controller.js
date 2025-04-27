const StudentProgress = require("../models/StudentProgress");
const Jutsu = require("../models/Jutsu");
const User = require("../models/User");

// @desc    Get all student progress (admin/teacher: all or filtered, student: their own)
// @route   GET /api/progress
// @access  Private
exports.getAllProgress = async (req, res) => {
  try {
    let query = {};

    // If student, only show their own progress
    if (req.user.role === "student") {
      query.student = req.user.id;
    }
    // If specific student filter is provided for admin/teacher
    else if (req.query.student) {
      query.student = req.query.student;
    }

    // Filter by jutsu if provided
    if (req.query.jutsu) {
      query.jutsu = req.query.jutsu;
    }

    // Filter by mastery status if provided
    if (req.query.mastered) {
      query.mastered = req.query.mastered === "true";
    }

    const progress = await StudentProgress.find(query)
      .populate("student", "firstName lastName username")
      .populate("jutsu", "name difficulty type element")
      .populate("feedback.teacher", "firstName lastName username");

    res.status(200).json({
      success: true,
      count: progress.length,
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single progress entry
// @route   GET /api/progress/:id
// @access  Private
exports.getProgress = async (req, res) => {
  try {
    const progress = await StudentProgress.findById(req.params.id)
      .populate("student", "firstName lastName username")
      .populate("jutsu", "name difficulty type element handSigns")
      .populate("feedback.teacher", "firstName lastName username");

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress entry not found",
      });
    }

    // Check if user is authorized to view this progress
    if (
      req.user.role === "student" &&
      progress.student._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this progress entry",
      });
    }

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create or update student progress
// @route   POST /api/progress
// @access  Private/Admin/Teacher
exports.createProgress = async (req, res) => {
  try {
    const { student, jutsu } = req.body;

    // Verify student exists and is a student
    const studentUser = await User.findById(student);
    if (!studentUser || studentUser.role !== "student") {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    // Verify jutsu exists
    const jutsuExists = await Jutsu.findById(jutsu);
    if (!jutsuExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid jutsu ID",
      });
    }

    // Check if progress entry already exists
    let progress = await StudentProgress.findOne({ student, jutsu });

    if (progress) {
      return res.status(400).json({
        success: false,
        message: "Progress entry already exists for this student and jutsu",
        data: { progressId: progress._id },
      });
    }

    // Create new progress entry
    progress = await StudentProgress.create({
      student,
      jutsu,
      startedAt: new Date(),
      progress: 0,
      mastered: false,
    });

    res.status(201).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update progress
// @route   PUT /api/progress/:id
// @access  Private
exports.updateProgress = async (req, res) => {
  try {
    let progress = await StudentProgress.findById(req.params.id);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress entry not found",
      });
    }

    // Students can only update their own progress
    if (
      req.user.role === "student" &&
      progress.student.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this progress entry",
      });
    }

    // Handle special case if completed
    if (req.body.mastered && req.body.mastered !== progress.mastered) {
      req.body.completedAt = new Date();

      // If a student is marking it as mastered, it needs teacher confirmation
      if (req.user.role === "student") {
        req.body.mastered = false; // Only teachers can confirm mastery
        req.body.progress = 100; // Set progress to 100% but not mastered yet
      }
    }

    // If this is a hand sign attempt being added
    if (req.body.handSignAttempt) {
      const { signPosition, sign, correct } = req.body.handSignAttempt;

      // Add attempt to the attempts array
      progress.handSignAttempts.push({
        signPosition,
        sign,
        correct,
        attemptedAt: new Date(),
      });

      // Update lastPracticed time
      progress.lastPracticed = new Date();

      // Recalculate overall progress percentage
      const jutsu = await Jutsu.findById(progress.jutsu);
      if (jutsu && jutsu.handSigns && jutsu.handSigns.length > 0) {
        // Count unique correct signs by position
        const uniqueCorrectSigns = new Set();
        progress.handSignAttempts.forEach((attempt) => {
          if (attempt.correct) {
            uniqueCorrectSigns.add(attempt.signPosition);
          }
        });

        // Calculate progress percentage
        const newProgress = Math.floor(
          (uniqueCorrectSigns.size / jutsu.handSigns.length) * 100
        );
        progress.progress = Math.min(newProgress, 100);
      }

      await progress.save();

      return res.status(200).json({
        success: true,
        data: progress,
      });
    }

    // Normal update (not adding attempt)
    progress = await StudentProgress.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add teacher feedback to progress
// @route   POST /api/progress/:id/feedback
// @access  Private/Admin/Teacher
exports.addFeedback = async (req, res) => {
  try {
    const progress = await StudentProgress.findById(req.params.id);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress entry not found",
      });
    }

    // Only teachers and admins can add feedback
    if (req.user.role !== "admin" && req.user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add feedback",
      });
    }

    const { comment, rating } = req.body;

    // Add feedback
    progress.feedback.push({
      teacher: req.user.id,
      comment,
      rating,
      createdAt: new Date(),
    });

    // If teacher is confirming mastery
    if (req.body.confirmMastery && progress.progress === 100) {
      progress.mastered = true;
      progress.completedAt = new Date();
    }

    await progress.save();

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get student dashboard stats
// @route   GET /api/progress/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const userId =
      req.user.role === "student" ? req.user.id : req.query.student;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required for non-student users",
      });
    }

    // Verify student exists
    const student = await User.findById(userId);
    if (!student || (req.user.role !== "admin" && student.role !== "student")) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    // Get all progress for this student
    const allProgress = await StudentProgress.find({
      student: userId,
    }).populate("jutsu", "name difficulty type element");

    // Calculate stats
    const stats = {
      totalJutsu: allProgress.length,
      masteredJutsu: allProgress.filter((p) => p.mastered).length,
      inProgressJutsu: allProgress.filter((p) => !p.mastered && p.progress > 0)
        .length,
      notStartedJutsu: allProgress.filter((p) => p.progress === 0).length,
      overallProgress: 0,
      byDifficulty: {
        beginner: { total: 0, mastered: 0 },
        intermediate: { total: 0, mastered: 0 },
        advanced: { total: 0, mastered: 0 },
        expert: { total: 0, mastered: 0 },
      },
      byType: {
        ninjutsu: { total: 0, mastered: 0 },
        genjutsu: { total: 0, mastered: 0 },
        taijutsu: { total: 0, mastered: 0 },
        "kekkei genkai": { total: 0, mastered: 0 },
        other: { total: 0, mastered: 0 },
      },
      recentProgress: allProgress
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5),
    };

    // Calculate overall progress percentage
    if (allProgress.length > 0) {
      const totalProgressSum = allProgress.reduce(
        (sum, p) => sum + p.progress,
        0
      );
      stats.overallProgress = Math.floor(totalProgressSum / allProgress.length);
    }

    // Calculate difficulty and type stats
    allProgress.forEach((p) => {
      if (p.jutsu) {
        // By difficulty
        const difficulty = p.jutsu.difficulty || "beginner";
        stats.byDifficulty[difficulty].total++;
        if (p.mastered) {
          stats.byDifficulty[difficulty].mastered++;
        }

        // By type
        const type = p.jutsu.type || "other";
        stats.byType[type].total++;
        if (p.mastered) {
          stats.byType[type].mastered++;
        }
      }
    });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
