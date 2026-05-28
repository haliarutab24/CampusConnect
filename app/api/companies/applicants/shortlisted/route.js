import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Application from "@/lib/models/Application";
import Booking from "@/lib/models/Booking";

// GET /api/companies/applicants/shortlisted - Get shortlisted/accepted applicants
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
      status: { $in: ["Shortlisted", "Accepted"] },
    })
      .populate("applicant", "name image resume skills bio email")
      .populate("job", "title location level category description tags")
      .populate("booking")
      .sort({ matchScore: -1, createdAt: -1 });

    return NextResponse.json({ success: true, applicants });
  } catch (error) {
    console.error("Fetch shortlisted error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch shortlisted applicants" },
      { status: 500 }
    );
  }
}
