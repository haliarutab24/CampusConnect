import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Application from "@/lib/models/Application";
import Booking from "@/lib/models/Booking";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";
import { createInterviewEvent } from "@/lib/google-calendar";

// POST /api/bookings - Candidate books an interview slot
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TalentSeeker") {
      return NextResponse.json(
        { success: false, message: "Only candidates can book interviews" },
        { status: 403 }
      );
    }

    await connectDB();

    const { applicationId, startTime, endTime } = await request.json();

    if (!applicationId || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: "applicationId, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    // Verify application exists and belongs to this candidate
    const application = await Application.findById(applicationId)
      .populate("recruiter", "name email")
      .populate("job", "title")
      .populate("applicant", "name email");

    if (!application) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 }
      );
    }

    if (application.applicant._id.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "You can only book interviews for your own applications" },
        { status: 403 }
      );
    }

    if (application.status !== "Shortlisted") {
      return NextResponse.json(
        { success: false, message: "You can only book interviews for shortlisted applications" },
        { status: 400 }
      );
    }

    if (application.booking) {
      return NextResponse.json(
        { success: false, message: "An interview is already booked for this application" },
        { status: 409 }
      );
    }

    // Check for double-booking
    const existingBooking = await Booking.findOne({
      recruiter: application.recruiter._id,
      startTime: new Date(startTime),
      status: { $ne: "Cancelled" },
    });

    if (existingBooking) {
      return NextResponse.json(
        { success: false, message: "This time slot is no longer available. Please choose another." },
        { status: 409 }
      );
    }

    // Create Google Calendar event with Meet link
    let meetLink = "";
    let eventId = "";

    try {
      const eventResult = await createInterviewEvent({
        recruiterId: application.recruiter._id.toString(),
        summary: `CampusConnect Interview: ${application.applicant.name} – ${application.job.title}`,
        description: `Screening interview for the "${application.job.title}" position.\n\nCandidate: ${application.applicant.name} (${application.applicant.email})\nRecruiter: ${application.recruiter.name} (${application.recruiter.email})\n\nThis is a brief 15-minute screening call scheduled via CampusConnect.`,
        startTime,
        endTime,
        recruiterEmail: application.recruiter.email,
        candidateEmail: application.applicant.email,
      });

      meetLink = eventResult.meetLink;
      eventId = eventResult.eventId;
    } catch (calendarError) {
      console.error("Google Calendar API error:", calendarError.message);
      // Continue without Calendar — fallback to booking without auto-generated link
      // The recruiter can manually add a link later
    }

    // Create the booking
    const booking = await Booking.create({
      application: applicationId,
      recruiter: application.recruiter._id,
      candidate: session.user.id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      meetLink,
      calendarEventId: eventId,
      status: "Scheduled",
    });

    // Update the application with booking info
    application.booking = booking._id;
    application.interviewLink = meetLink;
    application.interviewScheduledAt = new Date(startTime);
    await application.save();

    // Notify the recruiter
    await Notification.create({
      recipient: application.recruiter._id,
      sender: session.user.id,
      title: "Interview Booked",
      message: `${application.applicant.name} has booked a screening interview for "${application.job.title}" on ${new Date(startTime).toLocaleString()}.`,
      type: "Application",
      link: "/recruiter/shortlisted",
    });

    return NextResponse.json({
      success: true,
      message: meetLink
        ? "Interview booked! Google Calendar event created and invites sent."
        : "Interview booked! The recruiter will share the meeting link separately.",
      booking: {
        ...booking.toObject(),
        meetLink,
      },
    });
  } catch (error) {
    console.error("Book interview error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to book interview" },
      { status: 500 }
    );
  }
}

// GET /api/bookings - Get bookings for the current user
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

    const query =
      session.user.role === "TalentFinder"
        ? { recruiter: session.user.id }
        : { candidate: session.user.id };

    const bookings = await Booking.find(query)
      .populate("application")
      .populate("recruiter", "name email image companyName")
      .populate("candidate", "name email image")
      .sort({ startTime: -1 });

    return NextResponse.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
