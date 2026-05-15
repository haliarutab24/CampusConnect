import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    image: { type: String, default: "/premium-avatar.png" },
    role: {
      type: String,
      enum: ["TalentSeeker", "TalentFinder"],
      required: true,
      index: true,
    },

    // TalentSeeker (Student) fields
    resume: { type: String, default: "" },
    skills: [{ type: String, trim: true }],
    bio: { type: String, trim: true, default: "" },

    // TalentFinder (Recruiter) fields
    companyName: { type: String, trim: true, default: "" },
    description: { type: String, default: "" },
    website: { type: String, default: "" },
    location: { type: String, default: "" },
  },
  { timestamps: true }
);

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
