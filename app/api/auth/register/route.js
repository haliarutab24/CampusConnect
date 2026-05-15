import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { uploadToCloudinary } from "@/lib/cloudinary";
import bcrypt from "bcryptjs";

// POST /api/auth/register - Register a new user (Student or Recruiter)
export async function POST(request) {
  try {
    await connectDB();

    const formData = await request.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const role = formData.get("role");
    const imageFile = formData.get("image");

    // Student-specific fields
    const skills = formData.get("skills");
    const bio = formData.get("bio");

    // Recruiter-specific fields
    const companyName = formData.get("companyName");
    const description = formData.get("description");
    const website = formData.get("website");
    const location = formData.get("location");

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    if (!["TalentSeeker", "TalentFinder"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Upload image to Cloudinary if provided, otherwise use default
    let imageUrl = "/premium-avatar.png";
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadResult = await uploadToCloudinary(buffer, {
        folder: "campus-connect/avatars",
      });
      imageUrl = uploadResult.secure_url;
    }

    // Build user data
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      image: imageUrl,
    };

    if (role === "TalentSeeker") {
      userData.skills = skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : [];
      userData.bio = bio || "";
    } else {
      userData.companyName = companyName || name;
      userData.description = description || "";
      userData.website = website || "";
      userData.location = location || "";
    }

    const user = await User.create(userData);

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "Registration failed" },
      { status: 500 }
    );
  }
}
