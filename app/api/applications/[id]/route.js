import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Application from "@/lib/models/Application";
import Job from "@/lib/models/Job";

// PUT /api/applications/[id] - Update an application
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const application = await Application.findById(id);
    if (!application) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 });
    }

    // Only the applicant can update their own application
    if (application.applicant.toString() !== session.user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    // You can't edit an application if it's already Accepted or Rejected
    if (["Accepted", "Rejected"].includes(application.status)) {
      return NextResponse.json({ success: false, message: "Cannot edit an application with a final status" }, { status: 400 });
    }

    if (body.message !== undefined) application.message = body.message;
    if (body.resumeLink !== undefined) application.resumeLink = body.resumeLink;

    await application.save();

    return NextResponse.json({ success: true, message: "Application updated", application });
  } catch (error) {
    console.error("Update application error:", error);
    return NextResponse.json({ success: false, message: "Failed to update application" }, { status: 500 });
  }
}

// DELETE /api/applications/[id] - Delete/Withdraw an application
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const application = await Application.findById(id);
    if (!application) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 });
    }

    // Only the applicant can delete their own application
    if (application.applicant.toString() !== session.user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    await Application.findByIdAndDelete(id);

    // Decrease the applicants count on the Job
    await Job.findByIdAndUpdate(application.job, { $inc: { applicantsCount: -1 } });

    return NextResponse.json({ success: true, message: "Application withdrawn successfully" });
  } catch (error) {
    console.error("Delete application error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete application" }, { status: 500 });
  }
}
