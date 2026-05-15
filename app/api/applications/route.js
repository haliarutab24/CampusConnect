import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Application from "@/lib/models/Application";
import Job from "@/lib/models/Job";
import User from "@/lib/models/User";
import { calculateMatchScore } from "@/lib/matching";

// GET /api/applications - Get current user's applications
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

    const applications = await Application.find({
      applicant: session.user.id,
    })
      .populate("recruiter", "name email image companyName")
      .populate("job", "title location category level salary")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Fetch applications error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

// POST /api/applications - Apply for a job
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TalentSeeker") {
      return NextResponse.json(
        { success: false, message: "Only students can apply for jobs" },
        { status: 403 }
      );
    }

    await connectDB();

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { success: false, message: "Job ID is required" },
        { status: 400 }
      );
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 }
      );
    }

    if (job.status === "Closed") {
      return NextResponse.json(
        { success: false, message: "This job is no longer accepting applications" },
        { status: 400 }
      );
    }

    // Check for existing application (also enforced by unique compound index)
    const existingApp = await Application.findOne({
      applicant: session.user.id,
      job: jobId,
    });
    if (existingApp) {
      return NextResponse.json(
        { success: false, message: "Already applied to this job" },
        { status: 409 }
      );
    }

    // Get user skills for match score
    const user = await User.findById(session.user.id);
    const { score } = calculateMatchScore(user?.skills || [], job);

    const application = await Application.create({
      applicant: session.user.id,
      job: jobId,
      recruiter: job.postedBy,
      status: "Pending",
      matchScore: score,
      resumeLink: user?.resume || "",
    });

    // Update applicants count
    job.applicantsCount = (job.applicantsCount || 0) + 1;
    await job.save();

    return NextResponse.json(
      { success: true, message: "Job applied successfully", application },
      { status: 201 }
    );
  } catch (error) {
    console.error("Job application error:", error);
    return NextResponse.json(
      { success: false, message: "Application failed" },
      { status: 500 }
    );
  }
}
