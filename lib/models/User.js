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
    title: { type: String, trim: true, default: "" },
    coverLetter: { type: String, trim: true, default: "" },

    // TalentFinder (Recruiter) fields
    companyName: { type: String, trim: true, default: "" },
    description: { type: String, default: "" },
    website: { type: String, default: "" },
    location: { type: String, default: "" },

    // Google OAuth tokens (for Calendar API)
    googleAccessToken: { type: String, select: false },
    googleRefreshToken: { type: String, select: false },
    googleTokenExpiresAt: { type: Number, select: false },
  },
  { timestamps: true }
);

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Clear Mongoose cache to ensure new schema fields (like coverLetter) are registered during hot-reloads
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User = mongoose.model("User", userSchema);
export default User;
