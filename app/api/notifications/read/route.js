import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Notification from "@/lib/models/Notification";

// PUT /api/notifications/read - Mark a single notification as read
export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Notification ID is required" },
        { status: 400 }
      );
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: id, recipient: session.user.id },
      { read: true },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Marked as read",
      updated,
    });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to mark as read" },
      { status: 500 }
    );
  }
}
