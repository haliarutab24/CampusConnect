import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractTextFromFile } from "@/lib/extract-text";
import { analyzeResumeScore, analyzeResumeFromBuffer } from "@/lib/ai-scoring";

// POST /api/resume-analyzer - AI Resume Analysis using Gemini
// Accepts either:
//   - JSON body: { resumeText, jobDescription }
//   - FormData: resumeFile (PDF/DOCX/TXT) + jobDescription (text)
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
    let rawBuffer = null;
    let rawMimeType = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const resumeFile = formData.get("resumeFile");
      jobDescription = formData.get("jobDescription") || "";
      const pastedText = formData.get("resumeText") || "";

      if (resumeFile && resumeFile.size > 0) {
        if (resumeFile.size > 4 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, message: "File size must be under 4MB" },
            { status: 400 }
          );
        }

        const bytes = await resumeFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = (resumeFile.name || "").split(".").pop()?.toLowerCase();
        const isPdf =
          resumeFile.type === "application/pdf" || ext === "pdf";

        if (isPdf) {
          // PDFs: send raw bytes directly to Gemini — avoids all PDF parsing libs
          // that use browser-only APIs (DOMMatrix, canvas) which crash on Vercel
          rawBuffer = buffer;
          rawMimeType = "application/pdf";
        } else {
          // DOCX / TXT: text extraction works fine in Node.js
          try {
            resumeText = await extractTextFromFile(
              buffer,
              resumeFile.type,
              resumeFile.name
            );
          } catch (extractError) {
            return NextResponse.json(
              {
                success: false,
                message:
                  extractError.message || "Failed to extract text from file",
              },
              { status: 400 }
            );
          }
        }
      } else if (pastedText) {
        resumeText = pastedText;
      }
    } else {
      const body = await request.json();
      resumeText = body.resumeText || "";
      jobDescription = body.jobDescription || "";
    }

    // Must have either raw PDF buffer or extracted text
    if (!rawBuffer && !resumeText.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Resume text is required. Upload a file or paste your resume text.",
        },
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
      let analysis;
      if (rawBuffer) {
        // Send PDF bytes directly to Gemini — no text extraction needed
        analysis = await analyzeResumeFromBuffer(
          rawBuffer,
          rawMimeType,
          jobDescription
        );
      } else {
        analysis = await analyzeResumeScore(resumeText, jobDescription);
      }

      return NextResponse.json({
        success: true,
        message: "Resume analysis completed",
        analysis,
      });
    } catch (error) {
      const userMessage = error.message?.includes("503") ||
        error.message?.includes("high demand")
        ? "The AI service is currently experiencing high demand. Please try again in 30 seconds."
        : error.message?.includes("429")
        ? "AI service quota exceeded. Please try again later or check your API plan."
        : error.message?.includes("404")
        ? "Selected AI model is currently unavailable."
        : "Resume analysis failed. Please try again.";

      console.error("All Gemini attempts failed:", error);
      return NextResponse.json(
        {
          success: false,
          message: userMessage,
          details: error.message,
        },
        { status: error.message?.includes("429") ? 429 : 503 }
      );
    }
  } catch (error) {
    console.error("Resume analyzer error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "An unexpected error occurred during resume analysis.",
      },
      { status: 500 }
    );
  }
}
