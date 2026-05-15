import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Notification from "@/lib/models/Notification";

// GET /api/notifications - Get all notifications for current user
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

    const notifications = await Notification.find({
      recipient: session.user.id,
    })
      .populate("sender", "name image email companyName")
      .sort({ createdAt: -1 });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      count: notifications.length,
      unread: unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
