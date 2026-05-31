import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Application from "@/lib/models/Application";
import Job from "@/lib/models/Job";
import User from "@/lib/models/User";
import { calculateMatchScore } from "@/lib/matching";
import Booking from "@/lib/models/Booking";
import { extractTextFromUrl, extractTextFromFile } from "@/lib/extract-text";
import { analyzeResumeScore } from "@/lib/ai-scoring";
import fs from "fs/promises";
import path from "path";

/**
 * Extract resume text from a resume path/URL.
 * Handles both local file paths (/uploads/resumes/...) and external URLs (https://...).
 */
async function getResumeText(resumePath) {
  if (!resumePath) return null;

  // Local file: starts with / but not http
  if (resumePath.startsWith("/") && !resumePath.startsWith("http")) {
    const absolutePath = path.join(process.cwd(), "public", resumePath);
    console.log(`Reading local resume file: ${absolutePath}`);

    try {
      await fs.access(absolutePath);
    } catch {
      console.error(`Resume file not found on disk: ${absolutePath}`);
      return null;
    }

    const buffer = await fs.readFile(absolutePath);
    const fileName = path.basename(resumePath);
    const ext = path.extname(fileName).toLowerCase();

    // Determine MIME type from extension
    const mimeMap = {
      ".pdf": "application/pdf",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".doc": "application/msword",
      ".txt": "text/plain",
      ".md": "text/markdown",
    };
    const mimeType = mimeMap[ext] || "application/octet-stream";

    const text = await extractTextFromFile(buffer, mimeType, fileName);
    console.log(`Successfully extracted ${text.length} characters from local resume`);
    return text;
  }

  // External URL (Cloudinary, etc.)
  console.log(`Fetching resume from external URL: ${resumePath}`);
  return await extractTextFromUrl(resumePath);
}

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
    let aiAnalysisResult = null;

    // First fallback to basic keyword matching
    const { score: basicScore } = calculateMatchScore(user?.skills || [], job);
    finalScore = basicScore;

    // Try AI Scoring if resume is available
    if (user?.resume) {
      try {
        const resumeText = await getResumeText(user.resume);
        if (resumeText && resumeText.trim().length > 0) {
          console.log(`Running AI resume analysis for application to job ${jobId} (${resumeText.length} chars)`);
          const aiAnalysis = await analyzeResumeScore(resumeText, job.description);
          if (aiAnalysis && typeof aiAnalysis.overallScore === 'number') {
            finalScore = aiAnalysis.overallScore;
            aiAnalysisResult = aiAnalysis;
            console.log(`AI Score calculated successfully: ${finalScore}`);
          }
        } else {
          console.warn("Resume text extraction returned empty content. Using basic score.");
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
      {
        success: true,
        message: "Job applied successfully",
        application,
        matchScore: finalScore,
        aiAnalysis: aiAnalysisResult ? {
          overallScore: aiAnalysisResult.overallScore,
          strengths: aiAnalysisResult.strengths,
          areasToImprove: aiAnalysisResult.areasToImprove,
        } : null,
      },
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
