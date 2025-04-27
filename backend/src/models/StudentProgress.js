const mongoose = require("mongoose");

const StudentProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jutsu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Jutsu",
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    progress: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    mastered: {
      type: Boolean,
      default: false,
    },
    handSignAttempts: [
      {
        signPosition: {
          type: Number,
          required: true,
        },
        sign: {
          type: String,
          required: true,
        },
        correct: {
          type: Boolean,
          required: true,
        },
        attemptedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastPracticed: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
    feedback: [
      {
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        comment: {
          type: String,
          required: true,
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a student has only one progress record per jutsu
StudentProgressSchema.index({ student: 1, jutsu: 1 }, { unique: true });

module.exports = mongoose.model("StudentProgress", StudentProgressSchema);
