const Jutsu = require("../models/Jutsu");

exports.getAllJutsu = async (req, res) => {
  try {
    let query = {};

    if (req.query.type) {
      query.type = req.query.type;
    }

    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }

    if (req.query.element) {
      query.element = req.query.element;
    }

    if (req.user.role === "student") {
      query.isActive = true;
    }

    const jutsu = await Jutsu.find(query).populate(
      "createdBy",
      "firstName lastName username"
    );

    res.status(200).json({
      success: true,
      count: jutsu.length,
      data: jutsu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getJutsu = async (req, res) => {
  try {
    const jutsu = await Jutsu.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName username"
    );

    if (!jutsu) {
      return res.status(404).json({
        success: false,
        message: "Jutsu not found",
      });
    }

    if (req.user.role === "student" && !jutsu.isActive) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this jutsu",
      });
    }

    res.status(200).json({
      success: true,
      data: jutsu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createJutsu = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;

    if (req.body.handSigns) {
      const validHandSigns = req.body.handSigns.every(
        (sign) =>
          sign.position !== undefined &&
          sign.sign !== undefined &&
          typeof sign.position === "number" &&
          typeof sign.sign === "string"
      );

      if (!validHandSigns) {
        return res.status(400).json({
          success: false,
          message: "Hand signs must have position and sign properties",
        });
      }
    }

    const jutsu = await Jutsu.create(req.body);

    res.status(201).json({
      success: true,
      data: jutsu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.updateJutsu = async (req, res) => {
  try {
    let jutsu = await Jutsu.findById(req.params.id);

    if (!jutsu) {
      return res.status(404).json({
        success: false,
        message: "Jutsu not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      jutsu.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this jutsu",
      });
    }

    if (req.body.handSigns) {
      const validHandSigns = req.body.handSigns.every(
        (sign) =>
          sign.position !== undefined &&
          sign.sign !== undefined &&
          typeof sign.position === "number" &&
          typeof sign.sign === "string"
      );

      if (!validHandSigns) {
        return res.status(400).json({
          success: false,
          message: "Hand signs must have position and sign properties",
        });
      }
    }

    jutsu = await Jutsu.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: jutsu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.deleteJutsu = async (req, res) => {
  try {
    const jutsu = await Jutsu.findById(req.params.id);

    if (!jutsu) {
      return res.status(404).json({
        success: false,
        message: "Jutsu not found",
      });
    }

    // Make sure user is jutsu owner or admin
    if (
      req.user.role !== "admin" &&
      jutsu.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this jutsu",
      });
    }

    await jutsu.deleteOne();

    res.status(200).json({
      success: true,
      message: "Jutsu deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
