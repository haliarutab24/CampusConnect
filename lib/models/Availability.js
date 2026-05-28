import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      min: 0,
      max: 6, // 0 = Sunday, 6 = Saturday
    },
    startTime: {
      type: String,
      required: true, // "09:00" format (HH:mm)
    },
    endTime: {
      type: String,
      required: true, // "17:00" format (HH:mm)
    },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    slots: [slotSchema],
    slotDuration: {
      type: Number,
      default: 15, // minutes
      enum: [15, 30, 45, 60],
    },
    timezone: {
      type: String,
      default: "Asia/Karachi",
    },
  },
  { timestamps: true }
);

const Availability =
  mongoose.models.Availability ||
  mongoose.model("Availability", availabilitySchema);
export default Availability;
