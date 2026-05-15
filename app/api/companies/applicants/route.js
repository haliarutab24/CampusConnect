import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Application from "@/lib/models/Application";
import Job from "@/lib/models/Job";

// GET /api/companies/applicants - Get pending applicants for recruiter's jobs
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TalentFinder") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    await connectDB();

    const applicants = await Application.find({
      recruiter: session.user.id,
      status: "Pending",
    })
      .populate("applicant", "name image resume skills bio email")
      .populate("job", "title location level category")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, applicants });
  } catch (error) {
    console.error("Fetch applicants error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch applicants" },
      { status: 500 }
    );
  }
}
