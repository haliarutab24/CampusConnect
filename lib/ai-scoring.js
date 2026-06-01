import OpenAI from "openai";

// Shared JSON prompt template
const buildPrompt = (resumeText, jobDescription) => `You are a professional ATS (Applicant Tracking System) Specialist and Career Consultant. Perform a comprehensive deep-scan analysis of the provided CV/Resume against the given Job Description.

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

function parseJson(responseText) {
  if (!responseText) throw new Error("Empty response from AI model");
  const startIdx = responseText.indexOf("{");
  const endIdx = responseText.lastIndexOf("}");
  if (startIdx === -1 || endIdx === -1) {
    throw new SyntaxError("Could not find JSON object in AI response");
  }
  return JSON.parse(responseText.substring(startIdx, endIdx + 1));
}

/**
 * Analyze resume text using OpenRouter API.
 * OpenRouter has much higher rate limits than direct Gemini API free tier.
 * Uses the OPENROUTER_API_KEY already configured in the project.
 */
export async function analyzeResumeScore(resumeText, jobDescription) {
  if (!resumeText || !jobDescription) {
    throw new Error("Resume text and job description are required.");
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured.");
  }

  // OpenRouter is OpenAI-compatible — just point to a different base URL
  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://campus-connect-6zoy.vercel.app",
      "X-Title": "CampusConnect Resume Analyzer",
    },
  });

  // Models in order of preference — verified available on OpenRouter (June 2026)
  const models = [
    "meta-llama/llama-3.3-70b-instruct:free",   // Best free: strong JSON instruction follower
    "google/gemma-4-31b-it:free",                // Google Gemma 4 31B — solid fallback
    "qwen/qwen3-coder:free",                     // Qwen3 Coder 480B A35B — large, accurate
    "nousresearch/hermes-3-llama-3.1-405b:free", // Hermes 3 405B — very capable
  ];

  const prompt = buildPrompt(resumeText, jobDescription);
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Trying OpenRouter model: ${model}`);
      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.3,
      });

      const responseText = completion.choices?.[0]?.message?.content;
      if (!responseText) throw new Error("Empty response from AI model");

      return parseJson(responseText);
    } catch (err) {
      lastError = err;
      const status = err.status ?? err?.error?.status;
      console.error(`OpenRouter model ${model} failed (${status ?? "unknown"}):`, err.message);

      if (status === 404) {
        // Model endpoint not found — skip immediately
        console.warn(`Model ${model} not available on OpenRouter, skipping.`);
        continue;
      }

      // Retry on transient server errors
      if (status === 429 || status === 503) {
        await new Promise((r) => setTimeout(r, 2000));
      }
      // For all other errors, try next model
      continue;
    }
  }

  throw lastError || new Error("Resume analysis failed after all attempts.");
}

// Keep this export for backward compatibility (now delegates to text-based analysis)
export async function analyzeResumeFromBuffer(fileBuffer, mimeType, jobDescription) {
  throw new Error(
    "PDF is now handled client-side. This function should not be called."
  );
}
