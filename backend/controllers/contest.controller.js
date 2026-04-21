import Problem from "../models/Problem.js";
import User from "../models/User.js";
import Contest from "../models/Contest.js";
import ContestSubmission from "../models/ContestSubmission.js";
import Scoreboard from "../models/Scoreboard.js";
import submissionQueue from "../services/bullMQ.queue.js";

const createContest = async (req, res) => {
  try {
    const { title, slug, problems, startTime, endTime, participants } =
      req.body;

    //checking if any field is missing
    if (
      !title ||
      !slug ||
      !Array.isArray(problems) ||
      problems.length === 0 ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //checking if the start time is lesser then end time or not
    if (new Date(endTime) <= new Date(startTime)) {
      console.log("End time must be after start time");
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    //checking for problem validity
    const isValidProblems = problems.every(
      (p) => p.problemId && p.order !== undefined && p.points !== undefined,
    );

    if (!isValidProblems) {
      console.log("Invalid problems format");
      return res.status(400).json({
        success: false,
        message: "Invalid problems format",
      });
    }

    //checking if contest already exists
    const existingContest = await Contest.findOne({ slug });
    if (existingContest) {
      console.log("Contest already exists");
      return res.status(400).json({
        success: false,
        message: "Contest already exists",
      });
    }

    //checking if all provided problemIds exist in the db
    const problemIds = problems.map((p) => p.problemId);
    const existingProblems = await Problem.find({ _id: { $in: problemIds } });

    if (existingProblems.length !== problemIds.length) {
      console.log("One or more problems do not exist in the database");
      return res.status(404).json({
        success: false,
        message: "One or more problems do not exist in the database",
      });
    }

    //creating new contest document
    const newContest = await Contest.create({
      title,
      slug,
      problems,
      status: "upcoming",
      startTime,
      endTime,
      participants,
      createdBy: req.user.id,
    });

    console.log("Contest created");
    res.status(201).json({
      success: true,
      message: "Contest created",
      title: newContest.title,
      status: newContest.status,
      contestId: newContest._id,
    });
  } catch (err) {
    console.log(`An error occured while creating contest: ${err.message}`);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Contest already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getContest = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Contest not found",
      });
    }

    const contest = await Contest.findOne({ slug })
      .populate("createdBy", "username")
      .populate({
        path: "problems.problemId",
        select: "title slug",
      });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    return res.status(200).json({
      success: true,
      contest,
    });
  } catch (err) {
    console.log(`An error occured while getting contest: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const joinContest = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Contest slug is required",
      });
    }

    const updatedContest = await Contest.findOneAndUpdate(
      { slug },
      {
        $addToSet: { participants: userId }, // prevents duplicates
      },
      { new: true },
    );

    if (!updatedContest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Successfully joined the contest",
    });
  } catch (error) {
    console.error("Join Contest Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const leaveContest = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Contest slug is required",
      });
    }

    const contest = await Contest.findOne({ slug });
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    // Can only leave upcoming contests
    if (contest.status !== "upcoming") {
      return res.status(400).json({
        success: false,
        message: "You can only unregister from upcoming contests",
      });
    }

    await Contest.findOneAndUpdate(
      { slug },
      { $pull: { participants: userId } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Successfully unregistered from the contest",
    });
  } catch (error) {
    console.error("Leave Contest Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getContestProblems = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Contest not found",
      });
    }

    const contest = await Contest.findOne({ slug }).populate({
      path: "problems.problemId",
      select: "title slug",
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found"
      })
    }

    //Checking if user joined
    if (!contest.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You have not joined this contest",
      });
    }

    const now = new Date();

    //Contest not started
    if (now < contest.startTime) {
      return res.status(403).json({
        success: false,
        message: "Contest has not started yet",
      });
    }

    // Storing the only required fields to send
    const problems = contest.problems.map((p) => ({
      _id: p.problemId._id,
      title: p.problemId.title,
      slug: p.problemId.slug,
    }));



    return res.status(200).json({
      success: true,
      message: "Contest problems",
      problems
    });

  } catch (err) {
    console.log(`Error in getting any contest problem, ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal Server error",
    });
  }
};

const getAllContests = async (req, res) => {
  try {
    const now = new Date();

    // Dynamically update status based on current time
    await Contest.updateMany(
      { status: "upcoming", startTime: { $lte: now } },
      { $set: { status: "running" } }
    );
    await Contest.updateMany(
      { status: "running", endTime: { $lte: now } },
      { $set: { status: "ended" } }
    );

    const contests = await Contest.find()
      .populate("createdBy", "username")
      .select("-problems") // Exclude problems content for fetching list
      .sort({ startTime: -1 });

    return res.status(200).json({
      success: true,
      contests,
    });
  } catch (err) {
    console.log(`An error occured while getting all contests: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateContest = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, problems, startTime, endTime } = req.body;

    const contest = await Contest.findById(id);
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    if (title) contest.title = title;
    if (slug) contest.slug = slug;
    if (startTime) contest.startTime = startTime;
    if (endTime) contest.endTime = endTime;

    if (problems && Array.isArray(problems)) {
      const isValidProblems = problems.every(
        (p) => p.problemId && p.order !== undefined && p.points !== undefined,
      );
      if (!isValidProblems) {
        return res.status(400).json({ success: false, message: "Invalid problems format" });
      }
      contest.problems = problems;
    }

    await contest.save();

    return res.status(200).json({
      success: true,
      message: "Contest updated successfully",
      contest
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Contest slug/title already exists" });
    }
    console.error("Update Contest Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteContest = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedContest = await Contest.findByIdAndDelete(id);
    if (!deletedContest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    return res.status(200).json({ success: true, message: "Contest deleted successfully" });
  } catch (error) {
    console.error("Delete Contest Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const contestSubmission = async (req, res) => {
  try {
    const { slug } = req.params;
    const { problemId, code, language } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!slug || !problemId || !code || !language) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const contest = await Contest.findOne({ slug }).populate("problems.problemId");
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    // Check if user is a participant
    if (!contest.participants.includes(userId)) {
      return res.status(403).json({ success: false, message: "You have not joined this contest" });
    }

    // Check if contest is running
    const now = new Date();
    if (now < contest.startTime) {
      return res.status(403).json({ success: false, message: "Contest has not started yet" });
    }
    if (now > contest.endTime) {
      return res.status(403).json({ success: false, message: "Contest has already ended" });
    }

    // Check if problem is part of the contest
    const contestProblem = contest.problems.find(p => p.problemId._id.toString() === problemId);
    if (!contestProblem) {
      return res.status(400).json({ success: false, message: "Problem is not part of the contest" });
    }

    // Here you would typically add code to evaluate the submission and update its status
    //adding the submission to the queue for processing
    const job = await submissionQueue.add('runSubmission', {
      problemId,
      code,
      language,
      userId,
      contestId: contest._id,
      points: contestProblem.points,
      type: "contestSubmission"
    });

    return res.status(201).json({ success: true, message: "Submission received", submissionId: job.id });
  } catch (error) {
    console.error("Contest Submission Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

const getContestLeaderboard = async (req, res) => {
  try {
    const { slug } = req.params;

    const contest = await Contest.findOne({ slug }).populate("problems.problemId");
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    // Fetch all submissions for the contest
    const submissions = await ContestSubmission.find({ contestId: contest._id })
      .populate("userId", "username")
      .populate("problemId", "title");

    // Calculate scores and prepare leaderboard data
    const leaderboard = {};

    submissions.forEach(sub => {
      const userId = sub.userId._id.toString();
      if (!leaderboard[userId]) {
        leaderboard[userId] = {
          username: sub.userId.username,
          totalPoints: 0,
          problemsSolved: new Set(),
        };
      }
      if (sub.verdict === "AC") {
        const problemPoints = contest.problems.find(p => p.problemId._id.toString() === sub.problemId._id.toString())?.points || 0;
        if (!leaderboard[userId].problemsSolved.has(sub.problemId._id.toString())) {
          leaderboard[userId].totalPoints += problemPoints;
          leaderboard[userId].problemsSolved.add(sub.problemId._id.toString());
        }
      }
    });

    // Convert leaderboard object to array and sort by total points
    const sortedLeaderboard = Object.values(leaderboard).map(user => ({
      ...user,
      problemsSolved: Array.from(user.problemsSolved)
    })).sort((a, b) => b.totalPoints - a.totalPoints);
    console.log("Leaderboard:", sortedLeaderboard);
    return res.status(200).json({ success: true, leaderboard: sortedLeaderboard });
  } catch (error) {
    console.error("Get Contest Leaderboard Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export { createContest, getContest, joinContest, leaveContest, getContestProblems, getAllContests, updateContest, deleteContest, contestSubmission, getContestLeaderboard };
