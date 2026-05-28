import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Shortlisted", "Accepted", "Rejected", "Closed"],
      default: "Pending",
    },
    matchScore: { type: Number, default: 0, min: 0, max: 100 },
    message: { type: String, default: "" },
    resumeLink: { type: String, default: "" },
    interviewLink: { type: String, default: "" },
    interviewScheduledAt: { type: Date },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
  },
  { timestamps: true }
);

// Prevent duplicate applications at the database level
applicationSchema.index({ applicant: 1, job: 1 }, { unique: true });

// Compound index for recruiter queries
applicationSchema.index({ recruiter: 1, status: 1 });

const Application =
  mongoose.models.Application ||
  mongoose.model("Application", applicationSchema);
export default Application;
