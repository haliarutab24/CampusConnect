import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Availability from "@/lib/models/Availability";
import Booking from "@/lib/models/Booking";

// GET /api/availability/[recruiterId] - Get available slots for a recruiter (candidate-facing)
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { recruiterId } = await params;

    const availability = await Availability.findOne({ recruiter: recruiterId });
    if (!availability || !availability.slots.length) {
      return NextResponse.json({
        success: true,
        slots: [],
        message: "This recruiter has not set up availability yet",
      });
    }

    // Get existing bookings for this recruiter in the next 14 days
    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const existingBookings = await Booking.find({
      recruiter: recruiterId,
      status: { $ne: "Cancelled" },
      startTime: { $gte: now, $lte: twoWeeksLater },
    });

    const bookedTimes = new Set(
      existingBookings.map((b) => b.startTime.toISOString())
    );

    // Compute available 15-min slots for the next 14 days
    const availableSlots = [];
    const slotDuration = availability.slotDuration || 15;

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      date.setHours(0, 0, 0, 0);

      const dayOfWeek = date.getDay(); // 0 = Sunday

      // Find matching availability slots for this day of the week
      const daySlots = availability.slots.filter((s) => s.day === dayOfWeek);

      for (const slot of daySlots) {
        const [startH, startM] = slot.startTime.split(":").map(Number);
        const [endH, endM] = slot.endTime.split(":").map(Number);

        const slotStart = new Date(date);
        slotStart.setHours(startH, startM, 0, 0);

        const slotEnd = new Date(date);
        slotEnd.setHours(endH, endM, 0, 0);

        // Generate individual booking windows
        let windowStart = new Date(slotStart);
        while (windowStart.getTime() + slotDuration * 60 * 1000 <= slotEnd.getTime()) {
          const windowEnd = new Date(
            windowStart.getTime() + slotDuration * 60 * 1000
          );

          // Skip if in the past or already booked
          if (windowStart > now && !bookedTimes.has(windowStart.toISOString())) {
            availableSlots.push({
              startTime: windowStart.toISOString(),
              endTime: windowEnd.toISOString(),
              date: windowStart.toISOString().split("T")[0],
            });
          }

          windowStart = new Date(windowEnd);
        }
      }
    }

    return NextResponse.json({
      success: true,
      slots: availableSlots,
      slotDuration,
      timezone: availability.timezone,
    });
  } catch (error) {
    console.error("Fetch available slots error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}
