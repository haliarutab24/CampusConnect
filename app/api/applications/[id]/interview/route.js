import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Application from "@/lib/models/Application";
import Notification from "@/lib/models/Notification";

// PUT /api/applications/[id]/interview - Set interview link & schedule
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TalentFinder") {
      return NextResponse.json(
        { success: false, message: "Only recruiters can schedule interviews" },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const { interviewLink, interviewScheduledAt } = await request.json();

    if (!interviewLink || typeof interviewLink !== "string" || !interviewLink.trim()) {
      return NextResponse.json(
        { success: false, message: "A valid interview link is required" },
        { status: 400 }
      );
    }

    const updateData = { interviewLink: interviewLink.trim() };
    if (interviewScheduledAt) {
      updateData.interviewScheduledAt = new Date(interviewScheduledAt);
    }

    const updated = await Application.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("applicant", "name email")
      .populate("job", "title")
      .populate("recruiter", "name email image companyName");

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 }
      );
    }

    // Verify the recruiter owns this application
    if (updated.recruiter._id.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "You can only manage your own applicants" },
        { status: 403 }
      );
    }

    // Create notification for the applicant
    const scheduledText = interviewScheduledAt
      ? ` It is scheduled for ${new Date(interviewScheduledAt).toLocaleString()}.`
      : "";

    await Notification.create({
      recipient: updated.applicant._id,
      sender: session.user.id,
      title: "Interview Scheduled",
      message: `A screening call has been scheduled for your application to "${updated.job.title}".${scheduledText} Check your applications for the join link.`,
      type: "Application",
      link: "/student/applications",
    });

    return NextResponse.json({
      success: true,
      message: "Interview link saved and candidate notified.",
      updated,
    });
  } catch (error) {
    console.error("Interview schedule error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to schedule interview" },
      { status: 500 }
    );
  }
}
