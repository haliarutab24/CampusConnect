import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractTextFromFile } from "@/lib/extract-text";

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Gemini API key is not configured. Please set GEMINI_API_KEY in .env.local",
        },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Models to try in order (primary, then fallbacks)
    // Based on May 2026 probe: 3.1-flash-lite and 2.5-flash are active
    const models = ["gemini-3.1-flash-lite", "gemini-2.5-flash"];

    const prompt = `You are a professional ATS (Applicant Tracking System) Specialist and Career Consultant. Perform a comprehensive deep-scan analysis of the provided CV/Resume against the given Job Description.

## YOUR TASK:
Analyze the resume and return a JSON response with the following structure. DO NOT include any text outside the JSON.

## RESUME TEXT:
${resumeText}

## JOB DESCRIPTION:
${jobDescription}

## REQUIRED JSON OUTPUT FORMAT:
{
  "overallScore": <number 0-100>,
  "atsCompatibility": {
    "score": <number 0-100>,
    "issues": [<string array of specific ATS compatibility issues found>],
    "suggestions": [<string array of ATS improvement suggestions>]
  },
  "scoreBreakdown": {
    "formatting": {
      "score": <number 0-100>,
      "feedback": "<string>"
    },
    "contentQuality": {
      "score": <number 0-100>,
      "feedback": "<string>"
    },
    "keywordDensity": {
      "score": <number 0-100>,
      "feedback": "<string>"
    }
  },
  "keywordOptimization": {
    "presentKeywords": [<string array of JD keywords found in CV>],
    "missingKeywords": [<string array of JD keywords missing from CV>],
    "technicalSkillsGap": [<string array of missing technical skills>],
    "softSkillsGap": [<string array of missing soft skills>]
  },
  "actionPlan": {
    "highImpact": [
      {
        "action": "<specific action>",
        "reason": "<why this matters>",
        "example": "<example of how to implement>"
      }
    ],
    "mediumImpact": [
      {
        "action": "<specific action>",
        "reason": "<why this matters>",
        "example": "<example of how to implement>"
      }
    ]
  },
  "strengths": [<string array of what the candidate did well>],
  "areasToImprove": [<string array of specific areas needing improvement>],
  "starMethodSuggestions": [
    {
      "currentBullet": "<existing resume bullet that could be improved>",
      "improvedVersion": "<STAR-method improved version>"
    }
  ]
}

IMPORTANT RULES:
1. Be specific and actionable in all feedback
2. Reference actual content from both the resume and job description
3. The overallScore should reflect how well this resume would perform against ATS filters for this specific role
4. For missing keywords, focus on high-value technical terms and industry-specific language
5. STAR method suggestions should transform vague statements into quantified achievements
6. Return ONLY valid JSON, no markdown code blocks, no extra text`;

    // Try each model with retry
    let lastError = null;
    for (const modelName of models) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Trying model: ${modelName} (attempt ${attempt})`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();

          if (!responseText) {
            throw new Error("Empty response from AI model");
          }

          // Parse the JSON response from Gemini
          // Robust cleaning: find the first { and the last }
          const startIdx = responseText.indexOf("{");
          const endIdx = responseText.lastIndexOf("}");
          
          if (startIdx === -1 || endIdx === -1) {
            throw new SyntaxError("Could not find JSON object in AI response");
          }

          const cleanedResponse = responseText.substring(startIdx, endIdx + 1);
          const analysis = JSON.parse(cleanedResponse);

          return NextResponse.json({
            success: true,
            message: "Resume analysis completed",
            analysis,
          });
        } catch (err) {
          lastError = err;
          console.error(`Model ${modelName} attempt ${attempt} failed:`, err.message);

          // If it's a rate limit / overload error, wait before retry
          if (err.message?.includes("503") || err.message?.includes("429") || err.message?.includes("high demand")) {
            // Exponential backoff
            await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          } else if (err instanceof SyntaxError) {
            // JSON parse failed — maybe the model output was truncated or weird. 
            // If it's the last attempt for this model, try next model.
            if (attempt === 3) break;
            await new Promise((r) => setTimeout(r, 1000));
          } else {
            // Other error (404, auth, etc.) — don't retry same model
            break;
          }
        }
      }
    }

    // All attempts failed
    const userMessage = lastError?.message?.includes("503") || lastError?.message?.includes("high demand")
      ? "The AI service is currently experiencing high demand. Please try again in 30 seconds."
      : lastError?.message?.includes("429")
      ? "AI service quota exceeded. Please try again later or check your API plan."
      : lastError?.message?.includes("404")
      ? "Selected AI model is currently unavailable."
      : "Resume analysis failed. Please try again.";

    console.error("All Gemini attempts failed:", lastError);
    return NextResponse.json(
      { 
        success: false, 
        message: userMessage,
        details: lastError?.message 
      },
      { status: lastError?.message?.includes("429") ? 429 : 503 }
    );
  } catch (error) {
    console.error("Resume analyzer error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An unexpected error occurred during resume analysis." },
      { status: 500 }
    );
  }
}


