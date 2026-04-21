import mongoose from "mongoose";

const { Schema } = mongoose;

const ContestSubmissionSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
      index: true,
    },
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: ["cpp", "java"],
      required: true,
    },
    verdict: {
      type: String,
      enum: ["AC", "WA", "TLE", "RE", "CE", "MLE"],
      required: true,
    },
    executionTime: {
      type: Number,
    },
    memory: {
      type: Number,
    },
    score: {
      type: Number,
      default: 0,
    },
    attempt: {
      type: Number,
      default: 0,
    },
    isBest: {
      type: Boolean,
      default: false,
    },
    submissionTime: {
      type: Number, // seconds since contest start
    },
  },
  {
    timestamps: true,
  },
);

ContestSubmissionSchema.index({ contestId: 1, userId: 1 });
ContestSubmissionSchema.index({ contestId: 1, problemId: 1 });
ContestSubmissionSchema.index({ contestId: 1, userId: 1, problemId: 1,isBest: 1 });

const ContestSubmission = mongoose.model(
  "ContestSubmission",
  ContestSubmissionSchema,
);
export default ContestSubmission;
