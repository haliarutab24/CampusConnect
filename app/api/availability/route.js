import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Availability from "@/lib/models/Availability";

// GET /api/availability - Get current recruiter's availability
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TalentFinder") {
      return NextResponse.json(
        { success: false, message: "Only recruiters can manage availability" },
        { status: 403 }
      );
    }

    await connectDB();

    const availability = await Availability.findOne({
      recruiter: session.user.id,
    });

    return NextResponse.json({
      success: true,
      availability: availability || null,
    });
  } catch (error) {
    console.error("Fetch availability error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

// PUT /api/availability - Create or update recruiter availability
export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TalentFinder") {
      return NextResponse.json(
        { success: false, message: "Only recruiters can manage availability" },
        { status: 403 }
      );
    }

    await connectDB();

    const { slots, slotDuration, timezone } = await request.json();

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one availability slot is required" },
        { status: 400 }
      );
    }

    // Validate each slot
    for (const slot of slots) {
      if (slot.day < 0 || slot.day > 6) {
        return NextResponse.json(
          { success: false, message: "Day must be between 0 (Sunday) and 6 (Saturday)" },
          { status: 400 }
        );
      }
      if (!slot.startTime || !slot.endTime) {
        return NextResponse.json(
          { success: false, message: "Each slot must have startTime and endTime" },
          { status: 400 }
        );
      }
      if (slot.startTime >= slot.endTime) {
        return NextResponse.json(
          { success: false, message: "startTime must be before endTime" },
          { status: 400 }
        );
      }
    }

    const updateData = { slots };
    if (slotDuration) updateData.slotDuration = slotDuration;
    if (timezone) updateData.timezone = timezone;

    const availability = await Availability.findOneAndUpdate(
      { recruiter: session.user.id },
      { ...updateData, recruiter: session.user.id },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Availability updated successfully",
      availability,
    });
  } catch (error) {
    console.error("Update availability error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update availability" },
      { status: 500 }
    );
  }
}
