import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractTextFromFile } from "@/lib/extract-text";
import { analyzeResumeScore } from "@/lib/ai-scoring";

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

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      const resumeFile = formData.get("resumeFile");
      jobDescription = formData.get("jobDescription") || "";
      const pastedText = formData.get("resumeText") || "";

      if (resumeFile && resumeFile.size > 0) {
        // Validate file size (max 5MB)
        if (resumeFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, message: "File size must be under 5MB" },
            { status: 400 }
          );
        }

        try {
          const bytes = await resumeFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          resumeText = await extractTextFromFile(
            buffer,
            resumeFile.type,
            resumeFile.name
          );
        } catch (extractError) {
          return NextResponse.json(
            {
              success: false,
              message: extractError.message || "Failed to extract text from file",
            },
            { status: 400 }
          );
        }
      } else if (pastedText) {
        resumeText = pastedText;
      }
    } else {
      // Handle JSON body (backward compatible)
      const body = await request.json();
      resumeText = body.resumeText || "";
      jobDescription = body.jobDescription || "";
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Resume text is required. Upload a file or paste your resume text.",
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
      const analysis = await analyzeResumeScore(resumeText, jobDescription);
      
      return NextResponse.json({
        success: true,
        message: "Resume analysis completed",
        analysis,
      });
    } catch (error) {
      const userMessage = error.message?.includes("503") || error.message?.includes("high demand")
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
          details: error.message 
        },
        { status: error.message?.includes("429") ? 429 : 503 }
      );
    }
  } catch (error) {
    console.error("Resume analyzer error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An unexpected error occurred during resume analysis." },
      { status: 500 }
    );
  }
}

