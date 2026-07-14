import InterviewExperience from "../models/InterviewExperience.js";

// Create a new interview experience
export const createInterviewExperience = async (req, res) => {
  try {
    const { personalInfo, companyDetails, rounds, feedback } = req.body;

    // Check basic inputs
    if (!personalInfo || !companyDetails || !rounds || !feedback) {
      return res.status(400).json({
        success: false,
        message: "All sections (Personal Info, Company Details, Rounds, Feedback) are required.",
      });
    }

    if (!Array.isArray(rounds) || rounds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one round detail is required.",
      });
    }

    // Create the new document
    const newExperience = new InterviewExperience({
      user: req.user.id,
      personalInfo,
      companyDetails,
      rounds,
      feedback,
    });

    await newExperience.save();

    res.status(201).json({
      success: true,
      message: "Interview experience posted successfully!",
      data: newExperience,
    });
  } catch (error) {
    console.error("Error creating interview experience:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create interview experience.",
    });
  }
};

// Get all interview experiences with search and filtering
export const getAllInterviewExperiences = async (req, res) => {
  try {
    const { search, difficulty, outcome, mode, roundType } = req.query;
    const query = {};

    // Search query matches company name, role or candidate name
    if (search) {
      query.$or = [
        { "companyDetails.companyName": { $regex: search, $options: "i" } },
        { "companyDetails.role": { $regex: search, $options: "i" } },
        { "personalInfo.name": { $regex: search, $options: "i" } },
      ];
    }

    // Filter by overall outcome
    if (outcome) {
      query["feedback.outcome"] = outcome;
    }

    // Filter by difficulty (any round difficulty matching)
    if (difficulty) {
      query["rounds.difficulty"] = difficulty;
    }

    // Filter by mode (any round mode matching)
    if (mode) {
      query["rounds.mode"] = mode;
    }

    // Filter by roundType (any round type matching)
    if (roundType) {
      query["rounds.roundType"] = roundType;
    }

    const experiences = await InterviewExperience.find(query)
      .populate("user", "username email branch")
      .sort({ createdAt: -1 })
      .lean();

    const cleanedExperiences = experiences.map((exp) => {
      if (exp.personalInfo && !exp.personalInfo.showLinkedin) {
        delete exp.personalInfo.linkedin;
      }
      return exp;
    });

    res.status(200).json({
      success: true,
      count: cleanedExperiences.length,
      data: cleanedExperiences,
    });
  } catch (error) {
    console.error("Error fetching interview experiences:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve interview experiences.",
    });
  }
};

// Get specific interview experience by ID
export const getInterviewExperienceById = async (req, res) => {
  try {
    const { id } = req.params;

    const experience = await InterviewExperience.findById(id)
      .populate("user", "username email branch")
      .lean();

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: "Interview experience not found.",
      });
    }

    if (experience.personalInfo && !experience.personalInfo.showLinkedin) {
      delete experience.personalInfo.linkedin;
    }

    res.status(200).json({
      success: true,
      data: experience,
    });
  } catch (error) {
    console.error("Error fetching interview experience details:", error);
    // Handle invalid ObjectId cast error
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid experience ID format.",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve interview experience details.",
    });
  }
};
