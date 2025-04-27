// Load env vars first
const dotenv = require("dotenv");
dotenv.config({ path: "./backend/.env" });

const express = require("express");
const cors = require("cors");
const { dbConnect } = require("./config/db");

// Import routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const assignmentRoutes = require("./routes/assignment.routes");
const jutsuRoutes = require("./routes/jutsu.routes");
const progressRoutes = require("./routes/progress.routes");

// Connect to database
dbConnect();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/jutsu", jutsuRoutes);
app.use("/api/progress", progressRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to School Management API" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});
