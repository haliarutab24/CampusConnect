import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Job from "@/lib/models/Job";
import Application from "@/lib/models/Application";
import Notification from "@/lib/models/Notification";

// PUT /api/jobs/[id]/close - Close a job + update applications + notify
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TalentFinder") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (job.postedBy.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "You can only close your own jobs" },
        { status: 403 }
      );
    }

    // 1. Update job status
    job.status = "Closed";
    job.visible = false;
    await job.save();

    // 2. Get all applications for this job
    const applications = await Application.find({ job: id });

    if (applications.length > 0) {
      // 3. Update all applications to 'Closed'
      await Application.updateMany(
        { job: id },
        { $set: { status: "Closed" } }
      );

      // 4. Create notifications for all applicants
      const notifications = applications.map((app) => ({
        recipient: app.applicant,
        sender: session.user.id,
        title: "Job Closed",
        message: `The job "${job.title}" has been closed by the company.`,
        type: "Job",
        link: `/jobs/${id}`,
      }));

      await Notification.insertMany(notifications);
    }

    return NextResponse.json({
      success: true,
      message: `Job and ${applications.length} application(s) closed successfully.`,
    });
  } catch (error) {
    console.error("Close job error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to close job" },
      { status: 500 }
    );
  }
}
