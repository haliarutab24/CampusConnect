import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Notification from "@/lib/models/Notification";

// PUT /api/notifications/read-all - Mark all notifications as read
export async function PUT() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    await Notification.updateMany(
      { recipient: session.user.id, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all read error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to mark all as read" },
      { status: 500 }
    );
  }
}
