import OpenAI from "openai";

const FALLBACK_MODEL = "openrouter/free";
const REQUEST_TIMEOUT_MS = 18000;
const MAX_RESUME_CHARS = 12000;
const MAX_JOB_CHARS = 8000;

const STOP_WORDS = new Set([
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "also",
  "and",
  "any",
  "are",
  "because",
  "been",
  "being",
  "between",
  "both",
  "but",
  "can",
  "candidate",
  "candidates",
  "company",
  "could",
  "day",
  "each",
  "ensure",
  "for",
  "from",
  "future",
  "have",
  "into",
  "job",
  "make",
  "may",
  "meet",
  "more",
  "must",
  "need",
  "needs",
  "not",
  "our",
  "out",
  "per",
  "program",
  "programs",
  "requirements",
  "responsibilities",
  "role",
  "should",
  "software",
  "that",
  "the",
  "their",
  "them",
  "then",
  "these",
  "this",
  "those",
  "through",
  "under",
  "use",
  "user",
  "using",
  "well",
  "will",
  "with",
  "work",
  "you",
  "your",
]);

const TECH_SKILLS = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "node.js",
  "express",
  "mongodb",
  "mongoose",
  "sql",
  "mysql",
  "postgresql",
  "python",
  "java",
  "c++",
  "c#",
  "html",
  "css",
  "tailwind",
  "bootstrap",
  "api",
  "rest",
  "graphql",
  "git",
  "github",
  "docker",
  "aws",
  "azure",
  "gcp",
  "firebase",
  "testing",
  "debugging",
  "figma",
  "ui",
  "ux",
  "machine learning",
  "data analysis",
  "data science",
  "excel",
];

const SOFT_SKILLS = [
  "communication",
  "teamwork",
  "leadership",
  "collaboration",
  "problem solving",
  "analytical",
  "adaptability",
  "time management",
  "documentation",
  "presentation",
  "creativity",
  "ownership",
  "attention to detail",
];

const buildPrompt = (resumeText, jobDescription) => `You are a professional ATS (Applicant Tracking System) Specialist and Career Consultant. Perform a comprehensive deep-scan analysis of the provided CV/Resume against the given Job Description.

Return only valid JSON. Do not include markdown or explanatory text outside the JSON.

RESUME TEXT:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

REQUIRED JSON OUTPUT FORMAT:
{
  "overallScore": <number 0-100>,
  "atsCompatibility": {
    "score": <number 0-100>,
    "issues": [<string>],
    "suggestions": [<string>]
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
    "presentKeywords": [<string>],
    "missingKeywords": [<string>],
    "technicalSkillsGap": [<string>],
    "softSkillsGap": [<string>]
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
  "strengths": [<string>],
  "areasToImprove": [<string>],
  "starMethodSuggestions": [
    {
      "currentBullet": "<existing resume bullet that could be improved>",
      "improvedVersion": "<STAR-method improved version>"
    }
  ]
}

Rules:
1. Be specific and actionable.
2. Reference content from the resume and job description.
3. Focus missing keywords on high-value technical and role-specific terms.
4. Improve vague bullets into quantified STAR-style examples.`;

function clampScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
}

function compactText(text = "", max = 12000) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) : clean;
}

function parseJson(responseText) {
  if (!responseText) throw new Error("Empty response from AI model");
  const startIdx = responseText.indexOf("{");
  const endIdx = responseText.lastIndexOf("}");
  if (startIdx === -1 || endIdx === -1) {
    throw new SyntaxError("Could not find JSON object in AI response");
  }
  return JSON.parse(responseText.substring(startIdx, endIdx + 1));
}

function normalizeAnalysis(analysis, fallbackAnalysis) {
  if (!analysis || typeof analysis !== "object") {
    return fallbackAnalysis;
  }

  const normalized = {
    overallScore: clampScore(analysis.overallScore ?? fallbackAnalysis.overallScore),
    atsCompatibility: {
      score: clampScore(
        analysis.atsCompatibility?.score ?? fallbackAnalysis.atsCompatibility.score
      ),
      issues: asArray(
        analysis.atsCompatibility?.issues ?? fallbackAnalysis.atsCompatibility.issues
      ),
      suggestions: asArray(
        analysis.atsCompatibility?.suggestions ??
          fallbackAnalysis.atsCompatibility.suggestions
      ),
    },
    scoreBreakdown: {
      formatting: {
        score: clampScore(
          analysis.scoreBreakdown?.formatting?.score ??
            fallbackAnalysis.scoreBreakdown.formatting.score
        ),
        feedback:
          analysis.scoreBreakdown?.formatting?.feedback ||
          fallbackAnalysis.scoreBreakdown.formatting.feedback,
      },
      contentQuality: {
        score: clampScore(
          analysis.scoreBreakdown?.contentQuality?.score ??
            fallbackAnalysis.scoreBreakdown.contentQuality.score
        ),
        feedback:
          analysis.scoreBreakdown?.contentQuality?.feedback ||
          fallbackAnalysis.scoreBreakdown.contentQuality.feedback,
      },
      keywordDensity: {
        score: clampScore(
          analysis.scoreBreakdown?.keywordDensity?.score ??
            fallbackAnalysis.scoreBreakdown.keywordDensity.score
        ),
        feedback:
          analysis.scoreBreakdown?.keywordDensity?.feedback ||
          fallbackAnalysis.scoreBreakdown.keywordDensity.feedback,
      },
    },
    keywordOptimization: {
      presentKeywords: asArray(
        analysis.keywordOptimization?.presentKeywords ??
          fallbackAnalysis.keywordOptimization.presentKeywords
      ).slice(0, 20),
      missingKeywords: asArray(
        analysis.keywordOptimization?.missingKeywords ??
          fallbackAnalysis.keywordOptimization.missingKeywords
      ).slice(0, 20),
      technicalSkillsGap: asArray(
        analysis.keywordOptimization?.technicalSkillsGap ??
          fallbackAnalysis.keywordOptimization.technicalSkillsGap
      ).slice(0, 15),
      softSkillsGap: asArray(
        analysis.keywordOptimization?.softSkillsGap ??
          fallbackAnalysis.keywordOptimization.softSkillsGap
      ).slice(0, 15),
    },
    actionPlan: {
      highImpact:
        Array.isArray(analysis.actionPlan?.highImpact) &&
        analysis.actionPlan.highImpact.length
          ? analysis.actionPlan.highImpact
          : fallbackAnalysis.actionPlan.highImpact,
      mediumImpact:
        Array.isArray(analysis.actionPlan?.mediumImpact) &&
        analysis.actionPlan.mediumImpact.length
          ? analysis.actionPlan.mediumImpact
          : fallbackAnalysis.actionPlan.mediumImpact,
    },
    strengths: asArray(analysis.strengths ?? fallbackAnalysis.strengths).slice(0, 8),
    areasToImprove: asArray(
      analysis.areasToImprove ?? fallbackAnalysis.areasToImprove
    ).slice(0, 8),
    starMethodSuggestions:
      Array.isArray(analysis.starMethodSuggestions) &&
      analysis.starMethodSuggestions.length
        ? analysis.starMethodSuggestions
        : fallbackAnalysis.starMethodSuggestions,
  };

  normalized.source = analysis.source || "ai";
  return normalized;
}

function unique(items) {
  return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasTerm(text, term) {
  const pattern = new RegExp(
    `(^|[^a-z0-9+#.])${escapeRegExp(term)}([^a-z0-9+#.]|$)`,
    "i"
  );
  return pattern.test(text);
}

function extractTerms(text, max = 35) {
  const matches = String(text)
    .toLowerCase()
    .match(/[a-z][a-z0-9+#./-]{1,}/g);

  if (!matches) return [];

  const frequencies = new Map();
  for (const raw of matches) {
    const term = raw.replace(/^[-/.]+|[-/.]+$/g, "");
    if (term.length < 3 || STOP_WORDS.has(term) || /^\d+$/.test(term)) continue;
    frequencies.set(term, (frequencies.get(term) || 0) + 1);
  }

  return [...frequencies.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([term]) => term);
}

function extractKnownTerms(text, terms) {
  const normalizedText = String(text).toLowerCase();
  return terms.filter((term) => hasTerm(normalizedText, term.toLowerCase()));
}

function getFirstResumeLine(resumeText) {
  const lines = String(resumeText)
    .split(/\r?\n|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 25 && line.length < 220);

  return (
    lines.find((line) =>
      /developed|created|built|managed|designed|implemented|worked|responsible/i.test(
        line
      )
    ) || lines[0] || "Worked on projects and responsibilities related to the target role."
  );
}

export function analyzeResumeLocally(resumeText, jobDescription, reason = "") {
  const resume = compactText(resumeText, 20000);
  const jd = compactText(jobDescription, 12000);
  const resumeLower = resume.toLowerCase();
  const jdLower = jd.toLowerCase();

  const jdTerms = unique([
    ...extractKnownTerms(jdLower, TECH_SKILLS),
    ...extractKnownTerms(jdLower, SOFT_SKILLS),
    ...extractTerms(jdLower, 30),
  ]).slice(0, 40);

  const presentKeywords = jdTerms.filter((term) => hasTerm(resumeLower, term));
  const missingKeywords = jdTerms
    .filter((term) => !hasTerm(resumeLower, term))
    .slice(0, 16);
  const technicalSkillsGap = extractKnownTerms(jdLower, TECH_SKILLS)
    .filter((term) => !hasTerm(resumeLower, term))
    .slice(0, 10);
  const softSkillsGap = extractKnownTerms(jdLower, SOFT_SKILLS)
    .filter((term) => !hasTerm(resumeLower, term))
    .slice(0, 8);

  const sectionHits = [
    /education/i,
    /experience|employment|work history/i,
    /projects?/i,
    /skills?/i,
    /certifications?|courses?/i,
  ].filter((pattern) => pattern.test(resume)).length;

  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(resume);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(resume);
  const hasNumbers = /\b\d+%|\b\d+\+|\b\d{2,}\b/.test(resume);
  const actionVerbHits = (
    resume.match(
      /\b(achieved|built|created|designed|developed|improved|implemented|launched|led|managed|optimized|reduced|resolved|tested)\b/gi
    ) || []
  ).length;

  const keywordScore = jdTerms.length
    ? Math.round((presentKeywords.length / jdTerms.length) * 100)
    : 55;
  const formattingScore = clampScore(
    45 + sectionHits * 9 + (hasEmail ? 7 : 0) + (hasPhone ? 6 : 0)
  );
  const contentQualityScore = clampScore(
    42 +
      Math.min(actionVerbHits, 8) * 5 +
      (hasNumbers ? 12 : 0) +
      Math.min(Math.floor(resume.length / 1200), 8)
  );
  const atsScore = clampScore(Math.round(formattingScore * 0.55 + keywordScore * 0.45));
  const overallScore = clampScore(
    Math.round(
      keywordScore * 0.45 +
        contentQualityScore * 0.3 +
        formattingScore * 0.15 +
        atsScore * 0.1
    )
  );

  const issues = [];
  if (!hasEmail) issues.push("No email address was detected in the extracted resume text.");
  if (!hasPhone) issues.push("No phone number was detected in the extracted resume text.");
  if (sectionHits < 3) {
    issues.push(
      "The resume may be missing standard ATS-friendly sections such as Skills, Experience, Projects, or Education."
    );
  }
  if (missingKeywords.length > 6) {
    issues.push("Several important job-description keywords are missing or not clearly visible.");
  }
  if (!hasNumbers) {
    issues.push(
      "Achievements are not strongly quantified with numbers, percentages, or measurable outcomes."
    );
  }

  const suggestions = [
    "Mirror the exact wording of the most important job-description skills where they truthfully match your experience.",
    "Use clear section headings such as Skills, Projects, Experience, and Education.",
    "Add measurable impact to project and work bullets where possible.",
  ];

  const topMissing = missingKeywords.slice(0, 6);
  const firstLine = getFirstResumeLine(resume);

  return {
    overallScore,
    atsCompatibility: {
      score: atsScore,
      issues: issues.length
        ? issues
        : ["No major ATS blockers were detected from the extracted text."],
      suggestions,
    },
    scoreBreakdown: {
      formatting: {
        score: formattingScore,
        feedback:
          sectionHits >= 4
            ? "The resume includes several ATS-friendly sections and should parse reasonably well."
            : "Add clearer section headings so ATS systems and recruiters can scan it quickly.",
      },
      contentQuality: {
        score: contentQualityScore,
        feedback: hasNumbers
          ? "The resume includes some measurable details; strengthen them further in the most relevant bullets."
          : "Add quantified outcomes such as percentages, user counts, time saved, or project results.",
      },
      keywordDensity: {
        score: keywordScore,
        feedback: topMissing.length
          ? `Add relevant keywords from the role, especially: ${topMissing.join(", ")}.`
          : "The resume covers the strongest visible keywords from the job description.",
      },
    },
    keywordOptimization: {
      presentKeywords: presentKeywords.slice(0, 20),
      missingKeywords,
      technicalSkillsGap,
      softSkillsGap,
    },
    actionPlan: {
      highImpact: [
        {
          action: topMissing.length
            ? `Add truthful evidence for these target keywords: ${topMissing.join(", ")}.`
            : "Move the most role-relevant skills into the top third of the resume.",
          reason:
            "ATS systems and recruiters compare resume wording directly against the job description.",
          example: topMissing[0]
            ? `Skills: ${topMissing.slice(0, 4).join(", ")}. Project bullet: Built a feature using ${topMissing[0]} to solve a real user problem.`
            : "Add a short Technical Skills section before projects or experience.",
        },
        {
          action: "Rewrite vague bullets with action, scope, tool, and result.",
          reason:
            "Specific achievement bullets perform better than responsibility-only statements.",
          example:
            "Developed a React dashboard that reduced manual tracking time by 30% for a student recruitment workflow.",
        },
      ],
      mediumImpact: [
        {
          action: "Keep formatting simple and ATS-readable.",
          reason: "Complex layouts, icons, and tables can reduce parsing accuracy.",
          example: "Use plain headings, one-column content, and standard bullet points.",
        },
        {
          action: "Customize the summary for this exact role.",
          reason: "A targeted summary helps recruiters understand fit in the first scan.",
          example: `Frontend-focused student developer with experience in ${presentKeywords.slice(0, 3).join(", ") || "web development"} and project delivery.`,
        },
      ],
    },
    strengths: [
      presentKeywords.length
        ? `Matches ${presentKeywords.length} important terms from the job description, including ${presentKeywords.slice(0, 5).join(", ")}.`
        : "The resume has readable content that can be compared against the job description.",
      sectionHits >= 3
        ? "Includes multiple standard resume sections."
        : "Has enough extracted text to create a targeted improvement plan.",
      hasNumbers
        ? "Includes some numeric details, which can help demonstrate impact."
        : "Can be improved quickly by adding measurable outcomes to existing work.",
    ],
    areasToImprove: [
      topMissing.length
        ? `Add missing role keywords: ${topMissing.join(", ")}.`
        : "Make the strongest matching skills more prominent.",
      !hasNumbers
        ? "Add numbers or measurable outcomes to project and experience bullets."
        : "Add more context around the measurable results already present.",
      sectionHits < 4
        ? "Use clearer ATS-friendly sections such as Skills, Projects, Experience, and Education."
        : "Prioritize the most relevant projects and skills near the top.",
    ],
    starMethodSuggestions: [
      {
        currentBullet: firstLine,
        improvedVersion:
          "Built or improved a relevant feature using target-role tools, describing the situation, action taken, and measurable result in one bullet.",
      },
    ],
    source: "local-fallback",
    fallbackReason: reason,
  };
}

function getOpenRouterModels() {
  const configured = process.env.OPENROUTER_RESUME_MODEL || process.env.OPENROUTER_MODEL;
  const models = [
    ...(configured ? configured.split(",").map((model) => model.trim()) : []),
    FALLBACK_MODEL,
    "google/gemini-flash-latest",
    "google/gemini-3.5-flash",
  ];

  return unique(models);
}

function getAppUrl() {
  if (process.env.AUTH_URL) return process.env.AUTH_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function isFatalAuthError(error) {
  const status = error?.status ?? error?.error?.status ?? error?.response?.status;
  const message = String(error?.message || "").toLowerCase();
  return status === 401 || message.includes("invalid_api_key") || message.includes("api key");
}

export async function analyzeResumeScore(resumeText, jobDescription) {
  if (!resumeText || !jobDescription) {
    throw new Error("Resume text and job description are required.");
  }

  const fallbackAnalysis = analyzeResumeLocally(resumeText, jobDescription);
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      ...fallbackAnalysis,
      fallbackReason: "OPENROUTER_API_KEY is not configured.",
    };
  }

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    maxRetries: 0,
    timeout: REQUEST_TIMEOUT_MS,
    defaultHeaders: {
      "HTTP-Referer": getAppUrl(),
      "X-Title": "CampusConnect Resume Analyzer",
    },
  });

  const prompt = buildPrompt(
    compactText(resumeText, MAX_RESUME_CHARS),
    compactText(jobDescription, MAX_JOB_CHARS)
  );
  let lastError = null;

  for (const model of getOpenRouterModels()) {
    try {
      console.log(`Trying OpenRouter model: ${model}`);
      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 2200,
        temperature: 0.3,
      });

      const responseText = completion.choices?.[0]?.message?.content;
      if (!responseText) throw new Error("Empty response from AI model");

      return normalizeAnalysis(parseJson(responseText), fallbackAnalysis);
    } catch (error) {
      lastError = error;
      const status = error?.status ?? error?.error?.status ?? error?.response?.status;
      console.error(
        `OpenRouter model ${model} failed (${status ?? "unknown"}):`,
        error?.message
      );

      if (isFatalAuthError(error)) break;
      if (status === 429 || status === 503) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }
  }

  return {
    ...fallbackAnalysis,
    fallbackReason:
      lastError?.message || "OpenRouter models were unavailable, so local scoring was used.",
  };
}

export async function analyzeResumeFromBuffer() {
  throw new Error("PDF is handled client-side. Use analyzeResumeScore with extracted text.");
}
