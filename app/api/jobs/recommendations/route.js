import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Job from "@/lib/models/Job";
import Application from "@/lib/models/Application";
import User from "@/lib/models/User";
import { calculateMatchScore } from "@/lib/matching";

// GET /api/jobs/recommendations - AI-powered job recommendations
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

    // Fetch user with skills
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get IDs of jobs already applied to
    const appliedJobIds = await Application.find({
      applicant: user._id,
    }).distinct("job");

    // Get visible, open jobs not yet applied to
    const jobs = await Job.find({
      visible: true,
      status: "Open",
      _id: { $nin: appliedJobIds },
    }).populate("postedBy", "name image companyName");

    if (!user.skills?.length) {
      return NextResponse.json({
        success: true,
        message: "No skills found, showing latest jobs",
        recommendations: jobs.slice(0, 10).map((j) => ({
          ...j._doc,
          matchScore: 0,
          matchedSkills: [],
          missingKeywords: [],
        })),
      });
    }

    // Calculate match scores using enhanced algorithm
    const recommendations = jobs
      .map((job) => {
        const { score, matchedSkills, missingKeywords } = calculateMatchScore(
          user.skills,
          job
        );
        return {
          ...job._doc,
          matchScore: score,
          matchedSkills,
          missingKeywords,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore || b.createdAt - a.createdAt)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      message: "Recommended jobs fetched successfully",
      recommendations,
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
