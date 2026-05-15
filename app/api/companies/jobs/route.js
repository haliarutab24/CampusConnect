import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Job from "@/lib/models/Job";
import Application from "@/lib/models/Application";

// GET /api/companies/jobs - Get all jobs posted by the logged-in recruiter
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

    const jobs = await Job.find({ postedBy: session.user.id })
      .select("title description salary location status visible createdAt")
      .sort({ createdAt: -1 });

    // Attach applicant count for each job
    const jobsWithApplicants = await Promise.all(
      jobs.map(async (job) => {
        const applicants = await Application.countDocuments({ job: job._id });
        return {
          id: job._id,
          title: job.title,
          location: job.location,
          salary: job.salary,
          status: job.status,
          visible: job.visible,
          applicants,
          createdAt: job.createdAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      jobs: jobsWithApplicants,
    });
  } catch (error) {
    console.error("Fetch company jobs error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch company jobs" },
      { status: 500 }
    );
  }
}
