import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { uploadToCloudinary } from "@/lib/cloudinary";

// GET /api/users/me - Get current user's full profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Fetch user error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}

// PUT /api/users/me - Update current user's profile
export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const formData = await request.formData();
    const updateData = {};

    // Handle text fields
    const name = formData.get("name");
    const bio = formData.get("bio");
    const skills = formData.get("skills");
    const companyName = formData.get("companyName");
    const description = formData.get("description");
    const website = formData.get("website");
    const location = formData.get("location");

    if (name) updateData.name = name;
    if (bio !== null) updateData.bio = bio;
    if (skills) updateData.skills = skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (companyName) updateData.companyName = companyName;
    if (description !== null) updateData.description = description;
    if (website !== null) updateData.website = website;
    if (location !== null) updateData.location = location;

    // Handle image upload
    const imageFile = formData.get("image");
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadResult = await uploadToCloudinary(buffer, {
        folder: "campus-connect/avatars",
      });
      updateData.image = uploadResult.secure_url;
    }

    const user = await User.findByIdAndUpdate(session.user.id, updateData, {
      new: true,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
