import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Job from "@/lib/models/Job";

// GET /api/jobs/[id] - Fetch a single job by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const job = await Job.findById(id).populate(
      "postedBy",
      "name email image companyName"
    );

    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 }
      );
    }

    // Increment view count
    job.views = (job.views || 0) + 1;
    await job.save();

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Fetch job error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch job" },
      { status: 500 }
    );
  }
}
