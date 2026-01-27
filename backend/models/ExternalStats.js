import mongoose from "mongoose";
const { Schema } = mongoose;

const PlatformStatSchema = new Schema(
  {
    handle: { type: String, trim: true },
    rating: { type: Number, default: 0 },
    solvedCount: { type: Number, default: 0 },
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

    platformScores:{
      codeforces:{
        type:Number,
        default:0,
      },
      leetcode:{
        type:Number,
        default:0
      },
      codechef:{
        type:Number,
        default:0,
      },
      gfg:{
        type:Number,
        default:0
      }
    },

    // Aggregated leaderboard values
    totalScore: {
      type: Number,
      default: 0,
      index: true
    },

    totalSolved: {
      type: Number,
      default: 0,
      index:true
    },

    lastSyncedAt: {
      type: Date,
      default: Date.now
    },
    syncStatus:{
      type:String,
      enum:["idle", "queued", "syncing", "done", "failed"],
      default:"idle",
      index:true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("ExternalStats", ExternalStatsSchema);
