import { NextResponse } from "next/server";
import OpenAI from "openai";
import connectDB from "@/lib/db";
import Job from "@/lib/models/Job";
import User from "@/lib/models/User";

export const runtime = "nodejs";

const REQUEST_TIMEOUT_MS = 15000;

function getAppUrl() {
  if (process.env.AUTH_URL) return process.env.AUTH_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function unique(items) {
  return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
}

function getModels() {
  const configured = process.env.OPENROUTER_CHAT_MODEL || process.env.OPENROUTER_MODEL;
  return unique([
    ...(configured ? configured.split(",").map((model) => model.trim()) : []),
    "openrouter/free",
    "google/gemini-flash-latest",
    "google/gemini-3.5-flash",
  ]);
}

function sanitizeMessages(messages) {
  return messages
    .filter((message) => ["user", "assistant"].includes(message?.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, 2000),
    }))
    .filter((message) => message.content.trim())
    .slice(-8);
}

function formatJob(job, index) {
  const company = job.postedBy?.companyName || job.postedBy?.name || "Unknown Company";
  const tags = job.tags?.length ? ` Skills: ${job.tags.join(", ")}.` : "";
  const salary = job.salary ? ` Salary: PKR ${Number(job.salary).toLocaleString()}/month.` : "";
  return `${index + 1}. ${job.title} at ${company} (${job.category || "General"}, ${job.location || "Remote/Not specified"}).${salary}${tags}`;
}

async function loadPlatformContext() {
  try {
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

    return { openJobs, recruiters, dbAvailable: true };
  } catch (error) {
    console.error("Chatbot context load failed:", error?.message);
    return { openJobs: [], recruiters: [], dbAvailable: false };
  }
}

function buildSystemPrompt({ openJobs, recruiters, dbAvailable }) {
  const jobListText = openJobs.length
    ? openJobs.map(formatJob).join("\n")
    : "No open positions are currently available from the database context.";

  const companyListText = recruiters.length
    ? recruiters
        .map((recruiter) => {
          const name = recruiter.companyName || recruiter.name;
          const location = recruiter.location ? ` (${recruiter.location})` : "";
          return `- ${name}${location}`;
        })
        .join("\n")
    : "No companies are currently available from the database context.";

  return `You are CareerBot, the CampusConnect career assistant.

CampusConnect connects students with recruiters. Answer only about jobs, careers, resumes, applications, interviews, and the CampusConnect workflow.

Database status: ${dbAvailable ? "live data loaded" : "live data unavailable, answer from platform knowledge"}.

Active companies:
${companyListText}

Open jobs:
${jobListText}

Platform facts:
- Students browse jobs at /all-jobs and apply from each job page.
- Students can upload a resume in profile and run the Resume Analyzer.
- Students track applications at /student/applications.
- Recruiters post and manage jobs from /recruiter/manage-jobs.
- Shortlisted candidates can book interview slots if the recruiter has set availability.

Keep responses concise, helpful, and action-oriented. Never invent job listings that are not in the Open jobs list.`;
}

function buildFallbackReply(userText, { openJobs, dbAvailable }) {
  const text = userText.toLowerCase();
  const wantsApplicationHelp =
    text.includes("apply") || text.includes("application") || text.includes("submit");
  const wantsJobList =
    /\b(job|jobs|available|opening|openings|position|positions)\b/.test(text);

  if (
    wantsApplicationHelp &&
    !/\b(available|currently|openings|positions|list|show|find)\b/.test(text)
  ) {
    return "To apply, go to `/all-jobs`, open a job, and click Apply Now. For the strongest application, complete your student profile, upload your resume, and run the Resume Analyzer before submitting.";
  }

  if (wantsJobList) {
    if (!openJobs.length) {
      return dbAvailable
        ? "I do not see any open jobs posted right now. Check `/all-jobs` again later, or complete your profile so recommendations are ready when recruiters add roles."
        : "I could not load live job data just now. For the demo, open `/all-jobs` to browse the latest roles, then use search and filters by title, skill, or location.";
    }

    const jobLines = openJobs.slice(0, 5).map(formatJob).join("\n");
    return `Here are the latest open roles I found:\n\n${jobLines}\n\nOpen `/all-jobs`, choose a role, then click Apply Now to submit your profile and resume.`;
  }

  if (/\b(resume|cv|ats|score|analyze|analysis)\b/.test(text)) {
    return "For resume feedback, open `/student/resume-analyzer`, upload a PDF/DOCX/TXT resume or paste the text, then paste the job description. The analyzer will return a match score, missing keywords, ATS issues, strengths, and an action plan.";
  }

  if (/\b(interview|schedule|booking|book|meet|calendar)\b/.test(text)) {
    return "Interview scheduling happens after a recruiter shortlists you. Go to `/student/applications`, click Book Interview on a shortlisted application, choose an available slot, and the recruiter can share or attach the meeting link.";
  }

  if (/\b(profile|recommendation|recommendations|match)\b/.test(text)) {
    return "To improve recommendations, keep your profile updated with your skills, bio, resume, and location. CampusConnect compares your skills with open job requirements and shows better matches in `/student/recommendations`.";
  }

  return "I can help with CampusConnect jobs, applications, resume scoring, recommendations, and interview scheduling. Try asking: `What jobs are currently available?` or `How can I improve my resume for this role?`";
}

async function askOpenRouter(messages, context) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    maxRetries: 0,
    timeout: REQUEST_TIMEOUT_MS,
    defaultHeaders: {
      "HTTP-Referer": getAppUrl(),
      "X-Title": "CampusConnect CareerBot",
    },
  });

  let lastError = null;
  for (const model of getModels()) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(context) },
          ...messages,
        ],
        max_tokens: 600,
        temperature: 0.6,
      });

      const reply = completion.choices?.[0]?.message?.content?.trim();
      if (reply) return reply;
      throw new Error("Empty response from AI model");
    } catch (error) {
      lastError = error;
      const status = error?.status ?? error?.error?.status ?? error?.response?.status;
      console.error(`Chatbot model ${model} failed (${status ?? "unknown"}):`, error?.message);
      if (status === 401) break;
      if (status === 429 || status === 503) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }

  throw lastError || new Error("No chatbot model returned a response.");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const messages = sanitizeMessages(body.messages || []);

    if (!messages.length) {
      return NextResponse.json(
        { success: false, message: "messages array is required" },
        { status: 400 }
      );
    }

    const context = await loadPlatformContext();
    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");

    try {
      const reply = await askOpenRouter(messages, context);
      return NextResponse.json({ success: true, reply, source: "ai" });
    } catch (aiError) {
      console.error("Chatbot AI fallback used:", aiError?.message);
      const reply = buildFallbackReply(lastUserMessage?.content || "", context);
      return NextResponse.json({ success: true, reply, source: "fallback" });
    }
  } catch (error) {
    console.error("Chatbot API error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
