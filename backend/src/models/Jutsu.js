const mongoose = require("mongoose");

const JutsuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Jutsu name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    difficulty: {
      type: String,
      required: [true, "Difficulty level is required"],
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "beginner",
    },
    type: {
      type: String,
      required: [true, "Jutsu type is required"],
      enum: ["ninjutsu", "genjutsu", "taijutsu", "kekkei genkai", "other"],
      default: "ninjutsu",
    },
    element: {
      type: String,
      enum: ["fire", "water", "earth", "wind", "lightning", "none"],
      default: "none",
    },
    handSigns: [
      {
        position: {
          type: Number,
          required: true,
        },
        sign: {
          type: String,
          required: true,
          enum: [
            "rat",
            "ox",
            "tiger",
            "hare",
            "dragon",
            "snake",
            "horse",
            "goat",
            "monkey",
            "rooster",
            "dog",
            "boar",
            "bird",
            "special",
          ],
        },
        image: {
          type: String,
        },
      },
    ],
    chakraCost: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Jutsu", JutsuSchema);
