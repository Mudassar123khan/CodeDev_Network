import Problem from "../models/Problem.js";
import User from "../models/User.js";
import Contest from "../models/Contest.js";
import ContestSubmission from "../models/ContestSubmission.js";
import Scoreboard from "../models/Scoreboard.js";
import submissionQueue from "../services/bullMQ.queue.js";
import { computeContestStatus, syncContestStatuses } from "../services/contestStatus.service.js";

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

    const initialStatus = computeContestStatus({ startTime, endTime });

    //creating new contest document
    const newContest = await Contest.create({
      title,
      slug,
      problems,
      status: initialStatus,
      startTime,
      endTime,
      participants,
      createdBy: req.user.id,
    });

    // Auto-flag contest problems in Problem collection so they don't leak into practice
    await Problem.updateMany(
      { _id: { $in: problemIds } },
      { $set: { isContestProblem: true, contest: newContest._id } }
    );

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

    const contestObj = contest.toObject();
    const now = new Date();
    const isAdmin = req.user?.role === "admin";

    // Ensure status is up to date dynamically
    const currentStatus = computeContestStatus(contest, now);
    contestObj.status = currentStatus;
    if (contest.status !== currentStatus) {
      Contest.updateOne({ _id: contest._id }, { status: currentStatus }).catch((e) => {
        console.error("Failed to sync contest status on getContest:", e.message);
      });
    }

    // If contest hasn't started yet and requester is not an admin,
    // mask problem details so titles and slugs are not leaked ahead of time
    if (now < contest.startTime && !isAdmin) {
      contestObj.problems = (contestObj.problems || []).map((p, idx) => ({
        _id: p._id,
        order: p.order !== undefined ? p.order : idx + 1,
        points: p.points,
        problemId: null,
      }));
    }

    return res.status(200).json({
      success: true,
      contest: contestObj,
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

    const contest = await Contest.findOne({ slug });
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    const now = new Date();
    const currentStatus = computeContestStatus(contest, now);
    if (now > contest.endTime || currentStatus === "ended") {
      return res.status(400).json({
        success: false,
        message: "Cannot join a contest that has already ended",
      });
    }

    const updatedContest = await Contest.findOneAndUpdate(
      { slug },
      {
        $addToSet: { participants: userId }, // prevents duplicates
      },
      { new: true },
    );

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

    const now = new Date();
    const currentStatus = computeContestStatus(contest, now);

    // Can only leave upcoming contests
    if (currentStatus !== "upcoming") {
      if (contest.status !== currentStatus) {
        Contest.updateOne({ _id: contest._id }, { status: currentStatus }).catch(() => {});
      }
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

    //Checking if user joined (safe string comparison)
    const isParticipant = (contest.participants || []).some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You have not joined this contest",
      });
    }

    const now = new Date();
    const currentStatus = computeContestStatus(contest, now);

    // Contest not started
    if (currentStatus === "upcoming" || now < contest.startTime) {
      return res.status(403).json({
        success: false,
        message: "Contest has not started yet",
      });
    }

    // Storing the only required fields to send
    const problems = (contest.problems || [])
      .filter((p) => p.problemId)
      .map((p) => ({
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

    // Dynamically synchronize statuses in DB
    await syncContestStatuses(now);

    const contests = await Contest.find()
      .populate("createdBy", "username")
      .select("-problems") // Exclude problems content for fetching list
      .sort({ startTime: -1 });

    const formattedContests = contests.map((c) => {
      const obj = c.toObject();
      obj.status = computeContestStatus(c, now);
      return obj;
    });

    return res.status(200).json({
      success: true,
      contests: formattedContests,
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

    const now = new Date();
    const currentStatus = computeContestStatus(contest, now);
    if (currentStatus === "running") {
      return res.status(400).json({
        success: false,
        message: "Cannot modify problems or schedule while contest is actively running",
      });
    }

    if (title) contest.title = title;
    if (slug) contest.slug = slug;
    if (startTime) contest.startTime = startTime;
    if (endTime) contest.endTime = endTime;

    // Recalculate status based on schedule
    contest.status = computeContestStatus(contest, now);

    if (problems && Array.isArray(problems)) {
      const isValidProblems = problems.every(
        (p) => p.problemId && p.order !== undefined && p.points !== undefined,
      );
      if (!isValidProblems) {
        return res.status(400).json({ success: false, message: "Invalid problems format" });
      }
      contest.problems = problems;

      // Ensure updated problems are tagged as contest problems
      const problemIds = problems.map((p) => p.problemId);
      await Problem.updateMany(
        { _id: { $in: problemIds } },
        { $set: { isContestProblem: true, contest: contest._id } }
      );
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

    // Clean up associated submissions and scoreboards
    await ContestSubmission.deleteMany({ contestId: id });
    await Scoreboard.deleteMany({ contestId: id });

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

    // Check if user is a participant (safe string comparison)
    const isParticipant = (contest.participants || []).some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "You have not joined this contest" });
    }

    // Check if contest is running
    const now = new Date();
    const currentStatus = computeContestStatus(contest, now);
    if (currentStatus === "upcoming" || now < contest.startTime) {
      return res.status(403).json({ success: false, message: "Contest has not started yet" });
    }
    if (currentStatus === "ended" || now > contest.endTime) {
      return res.status(403).json({ success: false, message: "Contest has already ended" });
    }

    // Check if problem is part of the contest
    const contestProblem = contest.problems.find(
      (p) => p.problemId && p.problemId._id.toString() === problemId.toString()
    );
    if (!contestProblem) {
      return res.status(400).json({ success: false, message: "Problem is not part of the contest" });
    }

    const submissionTime = Math.max(0, Math.floor((now.getTime() - new Date(contest.startTime).getTime()) / 1000));

    // Adding the submission to the queue for processing
    const job = await submissionQueue.add('runSubmission', {
      problemId,
      code,
      language,
      userId,
      contestId: contest._id,
      points: contestProblem.points,
      submissionTime,
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

    // 1. Check pre-computed Scoreboard collection first (O(1) indexed lookup per user)
    const scoreboards = await Scoreboard.find({ contestId: contest._id })
      .populate("userId", "username")
      .sort({ totalScore: -1, totalPenalty: 1 })
      .lean();

    if (scoreboards && scoreboards.length > 0) {
      const sortedLeaderboard = scoreboards
        .filter((sc) => sc.userId) // filter deleted users safely
        .map((sc) => ({
          username: sc.userId.username || "Anonymous",
          totalPoints: sc.totalScore || 0,
          totalPenalty: sc.totalPenalty || 0,
          problemsSolved: (sc.problems || [])
            .filter((p) => p.isSolved)
            .map((p) => (p.problemId ? p.problemId.toString() : "")),
        }));

      return res.status(200).json({ success: true, leaderboard: sortedLeaderboard });
    }

    // 2. Backward-compatible fallback for contests with no pre-computed scoreboards
    const submissions = await ContestSubmission.find({ contestId: contest._id })
      .populate("userId", "username")
      .populate("problemId", "title")
      .lean();

    const leaderboard = {};

    submissions.forEach((sub) => {
      if (!sub.userId || !sub.problemId) return; // Skip deleted entities safely
      const userId = sub.userId._id ? sub.userId._id.toString() : sub.userId.toString();
      const username = sub.userId.username || "Anonymous";
      const problemIdStr = sub.problemId._id ? sub.problemId._id.toString() : sub.problemId.toString();

      if (!leaderboard[userId]) {
        leaderboard[userId] = {
          username,
          totalPoints: 0,
          problemsSolved: new Set(),
        };
      }
      if (sub.verdict === "AC") {
        const problemPoints = contest.problems.find(
          (p) => p.problemId && (p.problemId._id?.toString() === problemIdStr || p.problemId.toString() === problemIdStr)
        )?.points || 0;
        if (!leaderboard[userId].problemsSolved.has(problemIdStr)) {
          leaderboard[userId].totalPoints += problemPoints;
          leaderboard[userId].problemsSolved.add(problemIdStr);
        }
      }
    });

    const sortedLeaderboard = Object.values(leaderboard)
      .map((user) => ({
        ...user,
        problemsSolved: Array.from(user.problemsSolved),
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    return res.status(200).json({ success: true, leaderboard: sortedLeaderboard });
  } catch (error) {
    console.error("Get Contest Leaderboard Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getAllSubmissionsOfAContestProblem = async (req, res) => {
  try {
    const { slug, contestSlug } = req.params;
    const userId = req.user.id;

    const contest = await Contest.findOne({ slug: contestSlug });
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    // Check if user is a participant (safe string comparison)
    const isParticipant = (contest.participants || []).some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "You have not joined this contest" });
    }

    const problem = await Problem.findOne({ slug });
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    const submissions = await ContestSubmission.find({
      contestId: contest._id,
      problemId: problem._id,
      userId
    }).populate("problemId", "title").sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    console.error("Get Submissions of Contest Problem Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export { createContest, getContest, joinContest, leaveContest, getContestProblems, getAllContests, updateContest, deleteContest, contestSubmission, getContestLeaderboard, getAllSubmissionsOfAContestProblem };
