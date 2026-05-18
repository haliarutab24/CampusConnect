import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import fs from "fs/promises";
import path from "path";

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save locally to public/uploads/resumes
    const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes");
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.name) || (file.type === "application/pdf" ? ".pdf" : ".docx");
    const safeOriginalName = file.name ? file.name.replace(/[^a-zA-Z0-9.-]/g, '_') : `resume${ext}`;
    const filename = `${Date.now()}-${safeOriginalName}`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, buffer);
    const resumeUrl = `/uploads/resumes/${filename}`;

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
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
}
