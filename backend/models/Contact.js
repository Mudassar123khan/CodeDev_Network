import mongoose from "mongoose";
const { Schema } = mongoose;

const ContactSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: ["query", "suggestion", "feature_request", "bug_report", "other"],
      default: "query",
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "in_review", "resolved"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ type: 1 });
ContactSchema.index({ status: 1 });

const Contact = mongoose.model("Contact", ContactSchema);
export default Contact;
