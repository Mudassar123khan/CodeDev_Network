import InterviewExperience from "../models/InterviewExperience.js";
import { getCache, setCache, clearCacheByPrefix } from "../services/cache.service.js";

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

    // Invalidate cached interview lists
    await clearCacheByPrefix("interviews:");

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
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = req.query.limit === "all" ? 0 : Math.max(1, parseInt(req.query.limit) || 50);
    const skip = limit > 0 ? (page - 1) * limit : 0;

    // Check cache
    const cacheKey = `interviews:p${page}:l${limit}:s${search || ""}:d${difficulty || ""}:o${outcome || ""}:m${mode || ""}:r${roundType || ""}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      res.setHeader("Cache-Control", "no-cache");
      return res.status(200).json(cachedData);
    }

    const query = {};

    // Search query matches company name, role or candidate name
    if (search && search.trim()) {
      const trimmedSearch = search.trim();
      query.$or = [
        { "companyDetails.companyName": { $regex: trimmedSearch, $options: "i" } },
        { "companyDetails.role": { $regex: trimmedSearch, $options: "i" } },
        { "personalInfo.name": { $regex: trimmedSearch, $options: "i" } },
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

    let queryBuilder = InterviewExperience.find(query)
      .select("companyDetails.companyName companyDetails.role companyDetails.location feedback.outcome rounds.difficulty personalInfo.name createdAt user")
      .populate("user", "username")
      .sort({ createdAt: -1 })
      .lean();

    if (limit > 0) {
      queryBuilder = queryBuilder.skip(skip).limit(limit);
    }

    const [totalCount, experiences] = await Promise.all([
      InterviewExperience.countDocuments(query),
      queryBuilder.exec()
    ]);

    const cleanedExperiences = experiences.map((exp) => {
      if (exp.personalInfo && !exp.personalInfo.showLinkedin) {
        delete exp.personalInfo.linkedin;
      }
      return exp;
    });

    const responsePayload = {
      success: true,
      count: cleanedExperiences.length,
      totalCount,
      totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
      currentPage: page,
      limit: limit || totalCount,
      data: cleanedExperiences,
    };

    // Cache for 120 seconds
    await setCache(cacheKey, responsePayload, 120);

    res.setHeader("Cache-Control", "no-cache");
    res.status(200).json(responsePayload);
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
      .populate("user", "username email branch graduationYear")
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
