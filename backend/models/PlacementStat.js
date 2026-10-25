import mongoose from "mongoose";
const { Schema } = mongoose;

const PlacementStatSchema = new Schema(
  {
    branch: {
      type: String,
      required: true,
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
    },
    totalStudents: {
      type: Number,
    },
    studentsPlaced: {
      type: Number,
      required: true,
      default: 0,
    },
    totalOffers: {
      type: Number,
      required: true,
      default: 0,
    },
    minPackage: {
      type: Number,
      default: null,
    },
    maxPackage: {
      type: Number,
      default: null,
    },
    medianPackage: {
      type: Number,
      default: null,
    },
    averagePackage: {
      type: Number,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    isOverall: {
      type: Boolean,
      default: false,
    },
    program: {
      type: String,
      default: "B.Tech",
    },
  },
  {
    timestamps: true,
  }
);

const PlacementStat = mongoose.model("PlacementStat", PlacementStatSchema);
export default PlacementStat;
