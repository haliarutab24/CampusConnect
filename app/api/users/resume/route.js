import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { uploadToCloudinary } from "@/lib/cloudinary";

// POST /api/users/resume - Upload resume
export async function POST(request) {
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
    const file = formData.get("resume");

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Resume file is required" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await uploadToCloudinary(buffer, {
      folder: "campus-connect/resumes",
      resource_type: "raw",
    });

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { resume: uploadResult.secure_url },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Resume uploaded successfully",
      resumeUrl: user.resume,
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
}
