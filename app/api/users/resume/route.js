import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { uploadToCloudinary } from "@/lib/cloudinary";

// POST /api/users/resume - Upload resume to Cloudinary
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

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Only PDF and Word documents are allowed (.pdf, .doc, .docx)" },
        { status: 400 }
      );
    }

    // Max 4MB (under Vercel's 4.5MB body limit)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Resume must be under 4MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary (works on Vercel — no local filesystem needed)
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: "campus-connect/resumes",
      resource_type: "raw",          // raw = non-image files (PDF, DOCX)
      public_id: `${session.user.id}-${Date.now()}`,
      overwrite: true,
    });

    const resumeUrl = uploadResult.secure_url;

    // Save the Cloudinary URL to MongoDB
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { resume: resumeUrl },
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
      { success: false, message: "Failed to upload resume. Please try again." },
      { status: 500 }
    );
  }
}
