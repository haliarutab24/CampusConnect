import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Application from "@/lib/models/Application";
import Notification from "@/lib/models/Notification";

// PUT /api/applications/[id]/status - Change application status
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TalentFinder") {
      return NextResponse.json(
        { success: false, message: "Only recruiters can change application status" },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { success: false, message: "Status is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["Pending", "Shortlisted", "Rejected", "Accepted", "Closed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 }
      );
    }

    const updated = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("applicant", "name email")
      .populate("job", "title")
      .populate("recruiter", "name email image companyName");

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (updated.recruiter._id.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "You can only manage your own applicants" },
        { status: 403 }
      );
    }

    // Create notification for the applicant
    await Notification.create({
      recipient: updated.applicant._id,
      sender: session.user.id,
      title: `Application ${status}`,
      message: `Your application for "${updated.job.title}" has been marked as ${status}.`,
      type: "Application",
      link: "/student/applications",
    });

    return NextResponse.json({
      success: true,
      message: `Status updated to '${status}' and notification sent.`,
      updated,
    });
  } catch (error) {
    console.error("Status change error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to change application status" },
      { status: 500 }
    );
  }
}
