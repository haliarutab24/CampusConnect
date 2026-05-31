import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractTextFromFile } from "@/lib/extract-text";
import { analyzeResumeScore } from "@/lib/ai-scoring";

// POST /api/resume-analyzer - AI Resume Analysis via OpenRouter
// Accepts FormData with:
//   - resumeText  (string) — pasted text OR client-side extracted PDF text
//   - resumeFile  (file)   — DOCX or TXT only (PDFs are handled client-side)
//   - jobDescription (string)
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    let resumeText = "";
    let jobDescription = "";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      jobDescription = formData.get("jobDescription") || "";
      const pastedText = formData.get("resumeText") || "";
      const resumeFile = formData.get("resumeFile");

      if (pastedText) {
        // Text from paste OR client-side PDF extraction
        resumeText = pastedText;
      } else if (resumeFile && resumeFile.size > 0) {
        // DOCX / TXT — server-side text extraction (mammoth works fine in Node.js)
        if (resumeFile.size > 4 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, message: "File size must be under 4MB" },
            { status: 400 }
          );
        }
        const bytes = await resumeFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        try {
          resumeText = await extractTextFromFile(
            buffer,
            resumeFile.type,
            resumeFile.name
          );
        } catch (extractError) {
          return NextResponse.json(
            { success: false, message: extractError.message || "Failed to extract text from file" },
            { status: 400 }
          );
        }
      }
    } else {
      // JSON body fallback
      const body = await request.json();
      resumeText = body.resumeText || "";
      jobDescription = body.jobDescription || "";
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        { success: false, message: "Resume text is required. Upload a file or paste your resume text." },
        { status: 400 }
      );
    }

    if (!jobDescription.trim()) {
      return NextResponse.json(
        { success: false, message: "Job description is required" },
        { status: 400 }
      );
    }

    try {
      const analysis = await analyzeResumeScore(resumeText, jobDescription);
      return NextResponse.json({
        success: true,
        message: "Resume analysis completed",
        analysis,
      });
    } catch (error) {
      console.error("Resume analysis error:", error.message);

      // Show the real error message to help with debugging
      const msg = error.message || "";
      const userMessage =
        msg.includes("not configured") || msg.includes("API key")
          ? "AI service is not configured. Please check the OPENROUTER_API_KEY environment variable in Vercel."
          : msg.includes("429") || msg.includes("quota") || msg.includes("rate")
          ? "AI service quota exceeded. Please try again in a moment."
          : msg.includes("503") || msg.includes("high demand")
          ? "AI service is busy. Please try again in 30 seconds."
          : msg.includes("401") || msg.includes("Unauthorized") || msg.includes("invalid_api_key")
          ? "Invalid API key. Please check OPENROUTER_API_KEY in Vercel environment variables."
          : msg || "Resume analysis failed. Please try again.";

      return NextResponse.json(
        { success: false, message: userMessage, debug: msg },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Resume analyzer route error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Unexpected error during resume analysis." },
      { status: 500 }
    );
  }
}
