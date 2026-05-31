import { GoogleGenerativeAI } from "@google/generative-ai";

// Shared JSON prompt template (used for both text and raw-file analysis)
const buildPrompt = (jobDescription) => `You are a professional ATS (Applicant Tracking System) Specialist and Career Consultant. Perform a comprehensive deep-scan analysis of the provided CV/Resume against the given Job Description.

## YOUR TASK:
Analyze the resume and return a JSON response with the following structure. DO NOT include any text outside the JSON.

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

// Parse and validate the JSON response from Gemini
function parseGeminiJson(responseText) {
  if (!responseText) throw new Error("Empty response from AI model");
  const startIdx = responseText.indexOf("{");
  const endIdx = responseText.lastIndexOf("}");
  if (startIdx === -1 || endIdx === -1) {
    throw new SyntaxError("Could not find JSON object in AI response");
  }
  return JSON.parse(responseText.substring(startIdx, endIdx + 1));
}

// Retry helper — tries each model up to 3 times
async function runWithRetry(genAI, models, buildContent) {
  let lastError = null;
  for (const modelName of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Trying model: ${modelName} (attempt ${attempt})`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const content = buildContent();
        // content can be: string | Part[] | {contents: Content[]}
        const result = await model.generateContent(content);
        const responseText = result.response.text();
        return parseGeminiJson(responseText);
      } catch (err) {
        lastError = err;
        console.error(`Model ${modelName} attempt ${attempt} failed:`, err.message);
        if (
          err.message?.includes("503") ||
          err.message?.includes("429") ||
          err.message?.includes("high demand")
        ) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        } else if (err instanceof SyntaxError) {
          if (attempt === 3) break;
          await new Promise((r) => setTimeout(r, 1000));
        } else {
          break;
        }
      }
    }
  }
  throw lastError || new Error("Resume analysis failed after all attempts.");
}

/**
 * Analyze resume from extracted text (DOCX, TXT, pasted text)
 */
export async function analyzeResumeScore(resumeText, jobDescription) {
  if (!resumeText || !jobDescription) {
    throw new Error("Resume text and job description are required.");
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("Gemini API key is not configured.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"];
  const prompt = `## RESUME TEXT:\n${resumeText}\n\n${buildPrompt(jobDescription)}`;
  return runWithRetry(genAI, models, () => prompt);
}

/**
 * Analyze resume directly from a raw file buffer (PDFs).
 *
 * Sends the raw PDF bytes as base64 inline data directly to Gemini.
 * Gemini natively reads PDFs — NO pdf-parse / pdfjs-dist needed.
 * This permanently fixes the DOMMatrix crash on Vercel serverless.
 */
export async function analyzeResumeFromBuffer(fileBuffer, mimeType, jobDescription) {
  if (!fileBuffer || !jobDescription) {
    throw new Error("File buffer and job description are required.");
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("Gemini API key is not configured.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  // Use multimodal models that support inline file data
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash"];
  const base64Data = fileBuffer.toString("base64");
  const prompt = buildPrompt(jobDescription);

  return runWithRetry(genAI, models, () => ({
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || "application/pdf",
            },
          },
          { text: prompt },
        ],
      },
    ],
  }));
}
