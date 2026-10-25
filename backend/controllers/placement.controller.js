import PlacementStat from "../models/PlacementStat.js";
import PlacementMeta from "../models/PlacementMeta.js";

/**
 * Helper to ensure a PlacementMeta document exists in DB with baseline values
 */
const getOrCreatePlacementMeta = async (program = "B.Tech") => {
  let meta = await PlacementMeta.findOne({ program });
  if (!meta) {
    meta = await PlacementMeta.create({
      program,
      companiesCovered: [
        "Accenture",
        "TCS",
        "EPAM",
        "IDFC First Bank",
        "Juspay",
        "Visa",
      ],
      notes: [
        "This data is not official and has been collected from various sources",
        "We are not responsible for any misinterpretation of this data",
      ],
    });
  }
  return meta;
};

/**
 * Public: Get all B.Tech placement statistics from DB
 */
export const getPlacementStats = async (req, res) => {
  try {
    const program = req.query.program || "B.Tech";
    const stats = await PlacementStat.find({ program }).sort({ order: 1 });
    const meta = await getOrCreatePlacementMeta(program);

    const branches = stats.filter((s) => !s.isOverall);
    const overall = stats.find((s) => s.isOverall) || null;

    res.status(200).json({
      success: true,
      data: {
        branches,
        overall,
        companiesCovered: meta?.companiesCovered || [],
        notes: meta?.notes || [],
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
 * Admin: Get all placement statistics and metadata for admin dashboard
 */
export const getAllPlacementStatsAdmin = async (req, res) => {
  try {
    const stats = await PlacementStat.find({}).sort({ program: 1, order: 1 });
    const meta = await getOrCreatePlacementMeta("B.Tech");

    res.status(200).json({
      success: true,
      data: {
        stats,
        meta,
      },
    });
  } catch (error) {
    console.error("Error fetching admin placement stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch placement statistics for admin",
      error: error.message,
    });
  }
};

/**
 * Admin: Create a new placement record
 */
export const createPlacementStat = async (req, res) => {
  try {
    const {
      branch,
      shortName,
      totalStudents,
      studentsPlaced,
      totalOffers,
      minPackage,
      maxPackage,
      medianPackage,
      averagePackage,
      order,
      isOverall,
      program,
    } = req.body;

    if (!branch || !branch.trim()) {
      return res.status(400).json({
        success: false,
        message: "Branch name is required",
      });
    }

    const parseNum = (val) => (val === "" || val === null || val === undefined || isNaN(val) ? null : Number(val));

    const newStat = await PlacementStat.create({
      branch: branch.trim(),
      shortName: shortName?.trim() || "",
      totalStudents: parseNum(totalStudents),
      studentsPlaced: parseNum(studentsPlaced) ?? 0,
      totalOffers: parseNum(totalOffers) ?? 0,
      minPackage: parseNum(minPackage),
      maxPackage: parseNum(maxPackage),
      medianPackage: parseNum(medianPackage),
      averagePackage: parseNum(averagePackage),
      order: parseNum(order) ?? 0,
      isOverall: Boolean(isOverall),
      program: program?.trim() || "B.Tech",
    });

    res.status(201).json({
      success: true,
      message: "Placement record created successfully",
      data: newStat,
    });
  } catch (error) {
    console.error("Error creating placement stat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create placement record",
      error: error.message,
    });
  }
};

/**
 * Admin: Update an existing placement record
 */
export const updatePlacementStat = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      branch,
      shortName,
      totalStudents,
      studentsPlaced,
      totalOffers,
      minPackage,
      maxPackage,
      medianPackage,
      averagePackage,
      order,
      isOverall,
      program,
    } = req.body;

    const parseNum = (val) => (val === "" || val === null || val === undefined || isNaN(val) ? null : Number(val));

    const updateData = {};
    if (branch !== undefined) updateData.branch = branch.trim();
    if (shortName !== undefined) updateData.shortName = shortName.trim();
    if (totalStudents !== undefined) updateData.totalStudents = parseNum(totalStudents);
    if (studentsPlaced !== undefined) updateData.studentsPlaced = parseNum(studentsPlaced) ?? 0;
    if (totalOffers !== undefined) updateData.totalOffers = parseNum(totalOffers) ?? 0;
    if (minPackage !== undefined) updateData.minPackage = parseNum(minPackage);
    if (maxPackage !== undefined) updateData.maxPackage = parseNum(maxPackage);
    if (medianPackage !== undefined) updateData.medianPackage = parseNum(medianPackage);
    if (averagePackage !== undefined) updateData.averagePackage = parseNum(averagePackage);
    if (order !== undefined) updateData.order = parseNum(order) ?? 0;
    if (isOverall !== undefined) updateData.isOverall = Boolean(isOverall);
    if (program !== undefined) updateData.program = program.trim() || "B.Tech";

    const updatedStat = await PlacementStat.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!updatedStat) {
      return res.status(404).json({
        success: false,
        message: "Placement record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Placement record updated successfully",
      data: updatedStat,
    });
  } catch (error) {
    console.error("Error updating placement stat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update placement record",
      error: error.message,
    });
  }
};

/**
 * Admin: Delete a placement record
 */
export const deletePlacementStat = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PlacementStat.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Placement record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Placement record deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error deleting placement stat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete placement record",
      error: error.message,
    });
  }
};

/**
 * Admin: Update placement metadata (companies covered, notes)
 */
export const updatePlacementMeta = async (req, res) => {
  try {
    const { program = "B.Tech", companiesCovered, notes } = req.body;

    const updateFields = {};
    if (Array.isArray(companiesCovered)) {
      updateFields.companiesCovered = companiesCovered.map((c) => String(c).trim()).filter(Boolean);
    }
    if (Array.isArray(notes)) {
      updateFields.notes = notes.map((n) => String(n).trim()).filter(Boolean);
    }

    const updatedMeta = await PlacementMeta.findOneAndUpdate(
      { program },
      { $set: updateFields },
      { returnDocument: 'after', upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Placement metadata updated successfully",
      data: updatedMeta,
    });
  } catch (error) {
    console.error("Error updating placement meta:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update placement metadata",
      error: error.message,
    });
  }
};

/**
 * Admin: Auto-calculate and update Overall row from branches
 */
export const recalculateOverallStats = async (req, res) => {
  try {
    const program = req.body.program || "B.Tech";
    const branches = await PlacementStat.find({ program, isOverall: false });

    if (!branches || branches.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No branch records found to calculate overall summary",
      });
    }

    let totalStudentsSum = 0;
    let hasKnownStudents = false;
    let studentsPlacedSum = 0;
    let totalOffersSum = 0;
    let minPkg = null;
    let maxPkg = null;
    let totalWeightedPkg = 0;
    let totalWeight = 0;

    branches.forEach((b) => {
      if (b.totalStudents !== null && b.totalStudents !== undefined) {
        totalStudentsSum += Number(b.totalStudents);
        hasKnownStudents = true;
      }
      studentsPlacedSum += Number(b.studentsPlaced || 0);
      totalOffersSum += Number(b.totalOffers || 0);

      if (b.minPackage !== null && b.minPackage !== undefined) {
        minPkg = minPkg === null ? b.minPackage : Math.min(minPkg, b.minPackage);
      }
      if (b.maxPackage !== null && b.maxPackage !== undefined) {
        maxPkg = maxPkg === null ? b.maxPackage : Math.max(maxPkg, b.maxPackage);
      }
      if (b.averagePackage !== null && b.averagePackage !== undefined) {
        const weight = b.studentsPlaced > 0 ? b.studentsPlaced : (b.totalOffers || 1);
        totalWeightedPkg += b.averagePackage * weight;
        totalWeight += weight;
      }
    });

    const averagePackage = totalWeight > 0 ? Number((totalWeightedPkg / totalWeight).toFixed(2)) : null;

    // Determine or keep median package
    const overallTitle = `All ${program} branches`;
    let overallRecord = await PlacementStat.findOne({ program, isOverall: true });

    const medianPackage = overallRecord?.medianPackage ?? 8.5;

    const overallData = {
      branch: overallTitle,
      shortName: "All Branches",
      totalStudents: hasKnownStudents ? totalStudentsSum : null,
      studentsPlaced: studentsPlacedSum,
      totalOffers: totalOffersSum,
      minPackage: minPkg,
      maxPackage: maxPkg,
      medianPackage: medianPackage,
      averagePackage: averagePackage,
      isOverall: true,
      program,
      order: 999,
    };

    if (overallRecord) {
      overallRecord = await PlacementStat.findByIdAndUpdate(overallRecord._id, overallData, { returnDocument: 'after' });
    } else {
      overallRecord = await PlacementStat.create(overallData);
    }

    res.status(200).json({
      success: true,
      message: "Overall placement statistics recalculated successfully",
      data: overallRecord,
    });
  } catch (error) {
    console.error("Error recalculating overall stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to recalculate overall stats",
      error: error.message,
    });
  }
};
