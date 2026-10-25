import mongoose from "mongoose";
const { Schema } = mongoose;

const PlacementMetaSchema = new Schema(
  {
    program: {
      type: String,
      default: "B.Tech",
      unique: true,
      trim: true,
    },
    companiesCovered: {
      type: [String],
      default: [],
    },
    notes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const PlacementMeta = mongoose.model("PlacementMeta", PlacementMetaSchema);
export default PlacementMeta;
