import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    location: { type: String, required: true },
    level: {
      type: String,
      required: true,
    },
    description: { type: String, required: true },
    salary: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      index: true,
    },
    tags: [{ type: String, trim: true }],
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
    },
    visible: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    applicantsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index for filtered queries
jobSchema.index({ visible: 1, status: 1, category: 1 });

const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
export default Job;
