/**
 * Enhanced Job Matching Algorithm
 * Uses weighted scoring across job title, category, tags, and level.
 */

/**
 * Calculate a match score between user skills and a job posting
 * @param {string[]} userSkills - Array of user skill strings
 * @param {object} job - Job document with title, category, tags, level
 * @returns {{ score: number, matchedSkills: string[], missingKeywords: string[] }}
 */
export function calculateMatchScore(userSkills = [], job = {}) {
  if (!userSkills.length) {
    return { score: 0, matchedSkills: [], missingKeywords: [] };
  }

  const normalizedSkills = userSkills.map((s) => s.toLowerCase().trim());

  // Build searchable text segments with weights
  const segments = [
    { text: (job.title || "").toLowerCase(), weight: 3 },
    { text: (job.category || "").toLowerCase(), weight: 2 },
    { text: (job.tags || []).join(" ").toLowerCase(), weight: 2 },
    { text: (job.level || "").toLowerCase(), weight: 1 },
    { text: (job.description || "").toLowerCase().slice(0, 500), weight: 1 },
  ];

  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  let weightedScore = 0;
  const matchedSkillsSet = new Set();

  for (const segment of segments) {
    if (!segment.text) continue;

    const segmentMatches = normalizedSkills.filter((skill) =>
      segment.text.includes(skill)
    );

    segmentMatches.forEach((s) => matchedSkillsSet.add(s));

    // Score for this segment: proportion of skills matched * weight
    const segmentScore =
      (segmentMatches.length / normalizedSkills.length) * segment.weight;
    weightedScore += segmentScore;
  }

  // Normalize to 0-100
  const rawScore = (weightedScore / totalWeight) * 100;
  const score = Math.min(100, Math.round(rawScore));

  // Extract job keywords that user is missing
  const jobKeywords = extractKeywords(job);
  const missingKeywords = jobKeywords.filter(
    (kw) => !normalizedSkills.some((skill) => kw.includes(skill) || skill.includes(kw))
  );

  return {
    score,
    matchedSkills: Array.from(matchedSkillsSet),
    missingKeywords: missingKeywords.slice(0, 10),
  };
}

/**
 * Extract meaningful keywords from a job posting
 */
function extractKeywords(job) {
  const allText = [
    job.title || "",
    job.category || "",
    ...(job.tags || []),
  ]
    .join(" ")
    .toLowerCase();

  // Split by non-alphanumeric, filter short words
  const words = allText
    .split(/[^a-zA-Z0-9+#.]+/)
    .filter((w) => w.length > 2)
    .filter((w) => !STOP_WORDS.has(w));

  return [...new Set(words)];
}

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "with", "you", "that", "this",
  "have", "from", "will", "can", "our", "your", "all", "has",
  "been", "their", "more", "about", "other", "than", "into",
  "some", "its", "also", "after", "use", "two", "how",
]);
