import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Application from "@/lib/models/Application";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";
import { refreshGoogleToken, createGoogleMeetEvent } from "@/lib/google";

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
    let { interviewLink, interviewScheduledAt } = await request.json();

    const application = await Application.findById(id)
      .populate("applicant", "name email")
      .populate("job", "title")
      .populate("recruiter", "name email image companyName");

    if (!application) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 }
      );
    }

    // Verify the recruiter owns this application
    if (application.recruiter._id.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "You can only manage your own applicants" },
        { status: 403 }
      );
    }

    // Automatically generate Google Meet link if none provided
    if ((!interviewLink || !interviewLink.trim()) && interviewScheduledAt) {
      const recruiter = await User.findById(session.user.id).select(
        "+googleAccessToken +googleRefreshToken +googleTokenExpiresAt"
      );

      if (recruiter && recruiter.googleAccessToken) {
        let accessToken = recruiter.googleAccessToken;

        // Check if token is expired (adding 5 minute buffer)
        if (
          recruiter.googleTokenExpiresAt &&
          Date.now() >= (recruiter.googleTokenExpiresAt - 300) * 1000
        ) {
          try {
            const refreshed = await refreshGoogleToken(recruiter.googleRefreshToken);
            accessToken = refreshed.accessToken;
            await User.findByIdAndUpdate(recruiter._id, {
              googleAccessToken: refreshed.accessToken,
              googleRefreshToken: refreshed.refreshToken,
              googleTokenExpiresAt: refreshed.expiresAt,
            });
          } catch (error) {
            console.error("Failed to refresh token for Meet link:", error);
            // Will fallback to returning an error
          }
        }

        try {
          const event = await createGoogleMeetEvent({
            accessToken,
            summary: `Interview for ${application.job.title}`,
            description: `Interview with ${application.applicant.name} scheduled via CampusConnect.`,
            startTime: interviewScheduledAt,
          });

          if (event.hangoutLink) {
            interviewLink = event.hangoutLink;
          }
        } catch (error) {
          console.error("Failed to create Google Meet event:", error);
          return NextResponse.json(
            { success: false, message: "Failed to automatically generate Google Meet link. Please provide a manual link or ensure your Google Calendar permissions are correct." },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, message: "Please provide an interview link or log in with Google to automatically generate a Meet link." },
          { status: 400 }
        );
      }
    } else if (!interviewLink || typeof interviewLink !== "string" || !interviewLink.trim()) {
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
      message: "Interview scheduled and candidate notified.",
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
