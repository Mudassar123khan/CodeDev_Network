import PlacementStat from "../models/PlacementStat.js";

// Initial seed data from official JMI B.Tech placement document
const defaultBranchStats = [
  {
    branch: "Computer Engineering",
    shortName: "Computer",
    totalStudents: 88,
    studentsPlaced: 45,
    totalOffers: 58,
    minPackage: 3.60,
    maxPackage: 35.00,
    medianPackage: 8.50,
    averagePackage: 10.35,
    order: 1,
    isOverall: false,
    program: "B.Tech",
  },
  {
    branch: "Electronics and Communication Engineering",
    shortName: "ECE",
    totalStudents: 78,
    studentsPlaced: 20,
    totalOffers: 22,
    minPackage: 4.50,
    maxPackage: 12.00,
    medianPackage: 7.79,
    averagePackage: 8.13,
    order: 2,
    isOverall: false,
    program: "B.Tech",
  },
  {
    branch: "Electrical Engineering",
    shortName: "Electrical",
    // Explicit requirement: "For electrical the total number of students is missing so keep that place empty."
    totalStudents: null,
    studentsPlaced: 10,
    totalOffers: 10,
    minPackage: 4.50,
    maxPackage: 12.00,
    medianPackage: 5.50,
    averagePackage: 7.70,
    order: 3,
    isOverall: false,
    program: "B.Tech",
  },
  {
    branch: "Mechanical Engineering",
    shortName: "Mechanical",
    totalStudents: 75,
    studentsPlaced: 3,
    totalOffers: 3,
    minPackage: 4.50,
    maxPackage: 7.08,
    medianPackage: 4.50,
    averagePackage: 5.36,
    order: 4,
    isOverall: false,
    program: "B.Tech",
  },
  {
    branch: "Civil Engineering",
    shortName: "Civil",
    totalStudents: 56,
    studentsPlaced: 0,
    totalOffers: 0,
    minPackage: null,
    maxPackage: null,
    medianPackage: null,
    averagePackage: null,
    order: 5,
    isOverall: false,
    program: "B.Tech",
  },
  {
    branch: "All B.Tech branches",
    shortName: "All Branches",
    totalStudents: null, // Overall total not available due to missing Electrical count
    studentsPlaced: 78,
    totalOffers: 93,
    minPackage: 3.60,
    maxPackage: 35.00,
    medianPackage: 8.50,
    averagePackage: 9.38,
    order: 6,
    isOverall: true,
    program: "B.Tech",
  },
];

const officialNotes = [
  "This data is not official and has been collected from various sources",
  "We are not responsible for any misinterpretation of this data"
];

const companiesCovered = [
  "Accenture",
  "TCS",
  "EPAM",
  "IDFC First Bank",
  "Juspay",
  "Visa",
];

/**
 * Get all B.Tech branch placement statistics from DB
 */
export const getPlacementStats = async (req, res) => {
  try {
    let stats = await PlacementStat.find({ program: "B.Tech" }).sort({ order: 1 });

    // Auto-seed collection if empty
    if (!stats || stats.length === 0) {
      await PlacementStat.insertMany(defaultBranchStats);
      stats = await PlacementStat.find({ program: "B.Tech" }).sort({ order: 1 });
    }

    const branches = stats.filter((s) => !s.isOverall);
    const overall = stats.find((s) => s.isOverall) || null;

    res.status(200).json({
      success: true,
      data: {
        branches,
        overall,
        companiesCovered,
        notes: officialNotes,
      },
    });
  } catch (error) {
    console.error("Error fetching placement stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching placement statistics",
      error: error.message,
    });
  }
};

/**
 * Seed or reset placement stats (utility)
 */
export const seedPlacementStats = async (req, res) => {
  try {
    await PlacementStat.deleteMany({ program: "B.Tech" });
    await PlacementStat.insertMany(defaultBranchStats);
    const stats = await PlacementStat.find({ program: "B.Tech" }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      message: "Placement statistics successfully seeded in database",
      data: stats,
    });
  } catch (error) {
    console.error("Error seeding placement stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to seed placement statistics",
      error: error.message,
    });
  }
};
