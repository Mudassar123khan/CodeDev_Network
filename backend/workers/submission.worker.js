import { Worker } from "bullmq";
import axios from "axios";
import Problem from "../models/Problem.js";
import { JUDGE0_URL } from "../config/judgeUrl.js";
import Submission from "../models/Submission.js";
import { languageMap } from "../config/languages.js";
import { getIO } from "../config/socket.js";
import ContestSubmission from "../models/ContestSubmission.js";
import Scoreboard from "../models/Scoreboard.js";

const normalize = (str) => {
    return (str || "").trim().replace(/\s+/g, " ");
};

let submissionWorker = null;

const isBullMQEnabled = process.env.ENABLE_BULLMQ === "true" && process.env.NODE_ENV !== "test";

if (isBullMQEnabled) {
submissionWorker = new Worker("submissionQueue", async (job) => {
    const { problemId, code, language, userId, type } = job.data;
    const problem = await Problem.findById(problemId);
    const language_id = languageMap[language];
    if (type === "submission") {
        let verdict = "AC";
        let executionTime = 0;
        const outputs = [];

        for (const testcase of problem.testCases) {
            const judgeResponse = await axios.post(
                JUDGE0_URL,
                {
                    source_code: code,
                    language_id,
                    stdin: testcase.input,
                    cpu_time_limit: problem.timeLimit,
                    memory_limit: problem.memoryLimit
                },
                {
                    headers: { "Content-Type": "application/json" }
                }
            );

            const result = judgeResponse.data;
            const statusId = result?.status?.id;

            executionTime = Math.max(
                executionTime,
                parseFloat(result?.time) || 0
            );

            const actualOutput = normalize(result.stdout);
            const expectedOutput = normalize(testcase.output);

            let testcaseStatus = "Accepted";

            // CE
            if (statusId === 6) {
                testcaseStatus = "CE";
                verdict = "CE";
            }
            // TLE
            else if (statusId === 5) {
                testcaseStatus = "TLE";
                verdict = "TLE";
            }
            // RE
            else if (statusId >= 7 && statusId <= 12) {
                testcaseStatus = "RE";
                verdict = "RE";
            }
            // Successful execution → compare
            else if (statusId === 3) {
                if (actualOutput !== expectedOutput) {
                    testcaseStatus = "Wrong Answer";
                    verdict = "WA";
                }
            }
            // Unknown
            else {
                testcaseStatus = "Error";
                verdict = "RE";
            }

            //PUSH RESULT (YOU MISSED THIS)
            outputs.push({
                input: testcase.input,
                expectedOutput,
                actualOutput,
                status: testcaseStatus,
                executionTime: result.time || 0,
                memoryUsed: result.memory || 0
            });

            // stop early if failed
            if (verdict !== "AC") break;
        }

        const newSubmission = await Submission.create({
            userId,
            problemId,
            code,
            language,
            verdict,
            executionTime
        });

        // Return a plain serialisable object (not a Mongoose doc) so BullMQ
        // can store it in Redis and the completed-handler can emit test details.
        return {
            _id: newSubmission._id.toString(),
            verdict: newSubmission.verdict,
            executionTime: newSubmission.executionTime,
            outputs,
        };

    } else if (type === "runTest") {
        // Similar logic for running a single test case without saving the submission
        // This can be used for "Run Code" feature in the frontend
        const sampleTestcases = problem.testCases.filter(tc => tc.isSample);

        let outputs = [];
        let executionTime = 0;
        let overallVerdict = "AC";

        for (const testcase of sampleTestcases) {
            const judgeResponse = await axios.post(
                JUDGE0_URL,
                {
                    source_code: code,
                    language_id,
                    stdin: testcase.input,
                    cpu_time_limit: problem.timeLimit,
                    memory_limit: problem.memoryLimit
                },
                {
                    headers: { "Content-Type": "application/json" }
                }
            );

            const result = judgeResponse.data;
            const statusId = result?.status?.id;

            executionTime = Math.max(
                executionTime,
                parseFloat(result?.time) || 0
            );

            const actualOutput = normalize(result.stdout);
            const expectedOutput = normalize(testcase.output);

            let testcaseStatus = "Passed";

            // Compilation Error
            if (statusId === 6) {
                testcaseStatus = "CE";
                overallVerdict = "CE";
            }

            // Time Limit Exceeded
            else if (statusId === 5) {
                testcaseStatus = "TLE";
                overallVerdict = "TLE";
            }

            // Runtime Errors
            else if (statusId >= 7 && statusId <= 12) {
                testcaseStatus = "RE";
                overallVerdict = "RE";
            }

            // Successful execution → compare output
            else if (statusId === 3) {
                if (actualOutput !== expectedOutput) {
                    testcaseStatus = "Failed";
                    overallVerdict = "WA";
                }
            }

            // Unknown case
            else {
                testcaseStatus = "Error";
                overallVerdict = "RE";
            }

            outputs.push({
                input: testcase.input,
                expectedOutput,
                actualOutput,
                status: testcaseStatus,
                executionTime: result.time || 0,
                memoryUsed: result.memory || 0
            });

            // Stop early on serious errors (optional but better UX)
            if (overallVerdict !== "AC") break;
        }

        return outputs;

    } else if (type === "contestSubmission") {
        // Similar to "submission" but with contest-specific logic if needed
        // For now, we can treat it the same as a normal submission
        // You can add contest-specific checks (e.g., time of submission) here
        let verdict = "AC";
        let executionTime = 0;
        const outputs = [];

        for (const testcase of problem.testCases) {
            const judgeResponse = await axios.post(
                JUDGE0_URL,
                {
                    source_code: code,
                    language_id,
                    stdin: testcase.input,
                    cpu_time_limit: problem.timeLimit,
                    memory_limit: problem.memoryLimit
                },
                {
                    headers: { "Content-Type": "application/json" }
                }
            );

            const result = judgeResponse.data;
            const statusId = result?.status?.id;

            executionTime = Math.max(
                executionTime,
                parseFloat(result?.time) || 0
            );

            const actualOutput = normalize(result.stdout);
            const expectedOutput = normalize(testcase.output);

            let testcaseStatus = "Accepted";

            // CE
            if (statusId === 6) {
                testcaseStatus = "CE";
                verdict = "CE";
            }
            // TLE
            else if (statusId === 5) {
                testcaseStatus = "TLE";
                verdict = "TLE";
            }
            // RE
            else if (statusId >= 7 && statusId <= 12) {
                testcaseStatus = "RE";
                verdict = "RE";
            }
            // Successful execution → compare
            else if (statusId === 3) {
                if (actualOutput !== expectedOutput) {
                    testcaseStatus = "Wrong Answer";
                    verdict = "WA";
                }
            }
            // Unknown
            else {
                testcaseStatus = "Error";
                verdict = "RE";
            }

            outputs.push({
                input: testcase.input,
                expected: expectedOutput,
                actualOutput,
                status: testcaseStatus,
                executionTime: result.time || 0,
                memoryUsed: result.memory || 0
            });

            // stop early if failed
            if (verdict !== "AC") break;
        }

        let points = job.data.points || 0;
        if (verdict !== "AC") {
            points = 0; // No points if not accepted
        }

        const submissionTime = typeof job.data.submissionTime === "number"
            ? job.data.submissionTime
            : 0;

        // Atomically update pre-computed Scoreboard for the user & contest
        let scoreboard = await Scoreboard.findOne({
            contestId: job.data.contestId,
            userId
        });

        if (!scoreboard) {
            scoreboard = new Scoreboard({
                contestId: job.data.contestId,
                userId,
                totalScore: 0,
                totalPenalty: 0,
                problems: []
            });
        }

        let probEntry = scoreboard.problems.find(
            p => p.problemId && p.problemId.toString() === problemId.toString()
        );

        if (!probEntry) {
            probEntry = {
                problemId,
                score: 0,
                attempts: 0,
                isSolved: false,
                penalty: 0,
                lastSubmissionTime: submissionTime
            };
            scoreboard.problems.push(probEntry);
            probEntry = scoreboard.problems[scoreboard.problems.length - 1];
        }

        probEntry.attempts = (probEntry.attempts || 0) + 1;
        probEntry.lastSubmissionTime = submissionTime;

        if (verdict === "AC" && !probEntry.isSolved) {
            probEntry.isSolved = true;
            probEntry.score = job.data.points || 0;
            // Penalty: submissionTime in seconds + (previous wrong attempts * 20 minutes)
            const wrongAttempts = Math.max(0, probEntry.attempts - 1);
            probEntry.penalty = submissionTime + (wrongAttempts * 1200);

            scoreboard.totalScore = (scoreboard.totalScore || 0) + (job.data.points || 0);
            scoreboard.totalPenalty = (scoreboard.totalPenalty || 0) + probEntry.penalty;
        }

        await scoreboard.save();

        const newSubmission = await ContestSubmission.create({
            userId,
            problemId,
            code,
            language,
            verdict,
            executionTime,
            contestId: job.data.contestId,
            score: points,
            attempt: probEntry.attempts,
            isBest: probEntry.isSolved && verdict === "AC",
            submissionTime
        });

        return {
            _id: newSubmission._id.toString(),
            verdict: newSubmission.verdict,
            executionTime: newSubmission.executionTime,
            outputs,
        };
    } else {
        throw new Error("Unknown job type");
    }

}, {
    connection: {
        url: process.env.REDIS_URL,
    },
})

submissionWorker.on("completed", (job, result) => {
    console.log(`Job ${job.id} completed`);
    const { userId, type } = job.data;

    try {
        const io = getIO();

        if (type === "submission") {
            io.to(`room:${userId}`).emit("submission:result", {
                verdict: result.verdict,
                executionTime: result.executionTime,
                submissionId: result._id,
                outputs: result.outputs || [],
            });

        } else if (type === "runTest") {
            // result is the outputs array returned by the runTest branch
            io.to(`room:${userId}`).emit("run:result", {
                outputs: result,
            });
        }
        else if (type === "contestSubmission") {
            io.to(`room:${userId}`).emit("contestSubmission:result", {
                verdict: result.verdict,
                executionTime: result.executionTime,
                submissionId: result._id,
                outputs: result.outputs || [],
            });
        }
    } catch (err) {
        // Socket.io may not be initialised in test environments — log & move on
        console.warn("[WS] Could not emit result:", err.message);
    }
});

submissionWorker.on("failed", (job, err) => {
    console.error(`Job ${job.id} failed:`, err);
    const { userId, type } = job.data;

    try {
        const io = getIO();
        if (type === "submission") {
            io.to(`room:${userId}`).emit("submission:result", {
                verdict: "Error",
                executionTime: 0,
                submissionId: null,
                outputs: [],
            });
        } else if (type === "runTest") {
            io.to(`room:${userId}`).emit("run:result", {
                outputs: [],
                error: "Error running code"
            });
        } else if (type === "contestSubmission") {
            io.to(`room:${userId}`).emit("contestSubmission:result", {
                verdict: "Error",
                executionTime: 0,
                submissionId: null,
                outputs: [],
            });
        }
    } catch (err) {
        console.warn("[WS] Could not emit error result:", err.message);
    }
});

submissionWorker.on("error", (err) => {
    // Suppress unhandled EventEmitter crash when Redis is unreachable locally
});
} else {
    console.log("ℹ️ BullMQ submission worker is disabled (ENABLE_BULLMQ !== 'true'). Skipping Redis connection.");
}

export default submissionWorker;