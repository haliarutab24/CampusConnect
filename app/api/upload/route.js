import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { uploadToCloudinary } from "@/lib/cloudinary";

// POST /api/upload - Upload file to Cloudinary
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type") || "image"; // "image" or "resume"

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File is required" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const folder =
      type === "resume" ? "campus-connect/resumes" : "campus-connect/uploads";

    const uploadResult = await uploadToCloudinary(buffer, {
      folder,
      resource_type: type === "resume" ? "raw" : "image",
    });

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
}
