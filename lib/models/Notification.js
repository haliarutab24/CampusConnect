import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    type: {
      type: String,
      enum: ["Application", "Job", "System", "ResumeAnalysis"],
      default: "Application",
    },
    link: { type: String, default: "" },
  },
  { timestamps: true }
);

// Compound index for efficient unread count queries
notificationSchema.index({ recipient: 1, read: 1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
export default Notification;
