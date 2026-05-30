import { NextResponse } from "next/server";
import OpenAI from "openai";
import connectDB from "@/lib/db";
import Job from "@/lib/models/Job";
import User from "@/lib/models/User";

// POST /api/chatbot
// Body: { messages: [{ role: "user" | "assistant", content: string }] }
export async function POST(request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "Chatbot is not configured. OPENROUTER_API_KEY is missing." },
        { status: 503 }
      );
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, message: "messages array is required" },
        { status: 400 }
      );
    }

    // ── Fetch live platform data from DB ─────────────────────────────────────
    await connectDB();

    const [openJobs, recruiters] = await Promise.all([
      Job.find({ visible: true, status: "Open" })
        .select("title category location level salary tags description postedBy")
        .populate("postedBy", "name companyName")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      User.find({ role: "TalentFinder" })
        .select("name companyName location description website")
        .lean(),
    ]);

    // Build a compact, human-readable job listing for the system prompt
    const jobListText = openJobs.length > 0
      ? openJobs
          .map((job, i) => {
            const company = job.postedBy?.companyName || job.postedBy?.name || "Unknown Company";
            const tags = job.tags?.length ? ` | Skills: ${job.tags.join(", ")}` : "";
            return `${i + 1}. [${job.category}] ${job.title} — ${company}\n   📍 ${job.location} | Level: ${job.level} | Salary: PKR ${job.salary?.toLocaleString()}/month${tags}`;
          })
          .join("\n\n")
      : "No open positions at the moment.";

    const companyListText = recruiters.length > 0
      ? recruiters
          .map((r) => `• ${r.companyName || r.name}${r.location ? ` (${r.location})` : ""}${r.website ? ` — ${r.website}` : ""}`)
          .join("\n")
      : "No companies listed yet.";

    // ── Build system prompt ───────────────────────────────────────────────────
    const systemPrompt = `You are CareerBot, a friendly and knowledgeable AI career assistant for CampusConnect — an intra-university job marketplace connecting students (TalentSeekers) with recruiters (TalentFinders).

Your role is to:
- Help students discover job opportunities that match their skills and interests
- Explain the application process on CampusConnect
- Provide guidance on resume writing, interview preparation, and career development
- Answer questions about specific job listings using the live data below
- Be warm, encouraging, and professional

## 🏢 Active Companies on CampusConnect (${recruiters.length} total):
${companyListText}

## 💼 Currently Open Job Listings (${openJobs.length} positions):
${jobListText}

## Platform Information:
- Students can apply by visiting /all-jobs, clicking a job card, then hitting "Apply Now"
- Students need a profile with uploaded resume for best application results (AI match scoring)
- Recruiters post jobs from their /recruiter/manage-jobs dashboard
- Interview scheduling happens through the recruiter's applicants page
- Students track their applications at /student/applications

## Guidelines:
- Answer ONLY questions related to careers, jobs, the platform, or professional development
- If asked about something outside your scope, politely redirect to career topics
- Keep responses concise and actionable (max 3–4 short paragraphs)
- Use emoji sparingly for readability (✅, 📍, 💡, 🎯)
- Never fabricate job details — only reference the listings above
- Current date: ${new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;

    // ── Call OpenRouter via OpenAI SDK ────────────────────────────────────────
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "CampusConnect CareerBot",
      },
    });

    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error("Empty response from AI model");
    }

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error("Chatbot API error:", error);

    const status = error?.status || error?.response?.status;
    const userMessage =
      status === 401
        ? "Chatbot API key is invalid. Please check OPENROUTER_API_KEY."
        : status === 429
        ? "AI service is rate-limited. Please try again in a moment."
        : status === 503
        ? "AI service is temporarily unavailable. Please try again shortly."
        : "Something went wrong. Please try again.";

    return NextResponse.json(
      { success: false, message: userMessage },
      { status: status || 500 }
    );
  }
}
