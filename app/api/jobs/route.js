import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Job from "@/lib/models/Job";

// GET /api/jobs - Fetch all visible jobs with search/category filters
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const filter = { visible: true, status: "Open" };

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }
    if (category && category !== "all") {
      filter.category = category;
    }

    const jobs = await Job.find(filter)
      .populate("postedBy", "name email image companyName")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Fetch jobs error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Post a new job (Recruiter only)
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TalentFinder") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only recruiters can post jobs." },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { title, description, location, level, salary, category, tags } = body;

    if (!title || !description || !location || !level || !salary || !category) {
      return NextResponse.json(
        { success: false, message: "All fields are required (title, description, location, level, salary, category)" },
        { status: 400 }
      );
    }

    const job = await Job.create({
      title,
      description,
      location,
      level,
      salary: Number(salary),
      category,
      tags: tags || [],
      postedBy: session.user.id,
      visible: true,
      status: "Open",
    });

    return NextResponse.json(
      { success: true, message: "Job posted successfully!", job },
      { status: 201 }
    );
  } catch (error) {
    console.error("Job posting error:", error);
    return NextResponse.json(
      { success: false, message: "Job posting failed" },
      { status: 500 }
    );
  }
}
