import mongoose from "mongoose";
const { Schema } = mongoose;

const ProblemSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
      index: true
    },
    tags: {
      type: [String],
      required: true,
      index: true
    },
    constraints: {
      type: String,
      default: ""
    },

    timeLimit: {
      type: Number,
      default: 2
    },

    testCases: {
      type: [
        {
          input: {
            type: String,
            required: true
          },
          output: {
            type: String,
            required: true
          },
          isSample: {
            type: Boolean,
            default: false
          }
        }
      ],
      default: []
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    slug: {
      type: String,
      unique: true,
      index: true,
      required: true,
      lowercase: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["problem-set", "contest-set"],
      default: "problem-set"
    },
    timeLimit: {
      type: Number,
      default: 2
    },
    memoryLimit: {
      type: Number,
      default: 131072
    },
    isContestProblem: {
      type: Boolean,
      default: false
    },
    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest"
    }

  },
  {
    timestamps: true
  }
);

const Problem = mongoose.model("Problem", ProblemSchema);
export default Problem;