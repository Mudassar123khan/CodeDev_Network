import mongoose from "mongoose";
const { Schema } = mongoose;

const PlatformStatSchema = new Schema(
  {
    handle: { type: String, trim: true },
    rating: { type: Number, default: 0 },
    solvedCount: { type: Number, default: 0 },
    lastSynced: { type: Date }
  },
  { _id: false }
);

const ExternalStatsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    platforms: {
      codeforces: PlatformStatSchema,
      leetcode: PlatformStatSchema,
      codechef: PlatformStatSchema,
      gfg: PlatformStatSchema
    },

    // Aggregated leaderboard values
    totalScore: {
      type: Number,
      default: 0,
      index: true
    },

    totalSolved: {
      type: Number,
      default: 0
    },

    lastSyncedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("ExternalStats", ExternalStatsSchema);
