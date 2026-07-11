import mongoose from "mongoose";
const { Schema } = mongoose;

const RoundSchema = new Schema({
  roundName: {
    type: String,
    required: true,
    trim: true
  },
  roundType: {
    type: String,
    enum: [
      "Technical",
      "HR",
      "Coding test",
      "Final interview",
      "Offer discussion",
      "Cultural fit",
      "Group discussion",
      "Aptitude test",
      "System design",
      "Case study",
      "Behavioral",
      "Managerial"
    ],
    required: true
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    required: true
  },
  mode: {
    type: String,
    enum: ["remote", "onsite"],
    required: true
  },
  duration: {
    type: String,
    trim: true
  },
  summary: {
    type: String,
    required: true,
    trim: true
  }
});

const InterviewExperienceSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    personalInfo: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
      },
      currentRole: {
        type: String,
        trim: true
      },
      gradYear: {
        type: Number
      },
      linkedin: {
        type: String,
        trim: true
      },
      showLinkedin: {
        type: Boolean,
        default: false
      }
    },
    companyDetails: {
      companyName: {
        type: String,
        required: true,
        trim: true
      },
      role: {
        type: String,
        required: true,
        trim: true
      },
      location: {
        type: String,
        trim: true
      },
      jobType: {
        type: String,
        trim: true
      },
      experienceLevel: {
        type: String,
        trim: true
      }
    },
    rounds: [RoundSchema],
    feedback: {
      outcome: {
        type: String,
        enum: ["cleared", "rejected"],
        required: true
      },
      salaryRange: {
        type: String,
        trim: true
      },
      prepTips: {
        type: String,
        trim: true
      }
    }
  },
  {
    timestamps: true
  }
);

const InterviewExperience = mongoose.model("InterviewExperience", InterviewExperienceSchema);

export default InterviewExperience;
