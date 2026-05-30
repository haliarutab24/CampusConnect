import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Application from "@/lib/models/Application";
import Job from "@/lib/models/Job";
import User from "@/lib/models/User";
import { calculateMatchScore } from "@/lib/matching";
import Booking from "@/lib/models/Booking";
import { extractTextFromUrl } from "@/lib/extract-text";
import { analyzeResumeScore } from "@/lib/ai-scoring";

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
      .populate("booking")
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

    // Get user skills and resume for match score
    const user = await User.findById(session.user.id);
    let finalScore = 0;

    // First fallback to basic keyword matching
    const { score: basicScore } = calculateMatchScore(user?.skills || [], job);
    finalScore = basicScore;

    // Try AI Scoring if resume is available
    if (user?.resume) {
      try {
        console.log(`Extracting text from resume URL: ${user.resume}`);
        const resumeText = await extractTextFromUrl(user.resume);
        console.log(`Running AI resume analysis for application to job ${jobId}`);
        const aiAnalysis = await analyzeResumeScore(resumeText, job.description);
        if (aiAnalysis && typeof aiAnalysis.overallScore === 'number') {
          finalScore = aiAnalysis.overallScore;
          console.log(`AI Score calculated successfully: ${finalScore}`);
        }
      } catch (err) {
        console.error("AI Scoring failed during application, falling back to basic score:", err.message);
        // We gracefully ignore the error so the application still succeeds
      }
    } else {
      console.log("User has no resume attached. Using basic match score.");
    }

    const application = await Application.create({
      applicant: session.user.id,
      job: jobId,
      recruiter: job.postedBy,
      status: "Pending",
      matchScore: finalScore,
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
