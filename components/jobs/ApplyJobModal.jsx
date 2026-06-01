"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { X, Upload, FileText, Sparkles, LoaderCircle, CheckCircle, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const getScoreColor = (score) => {
  if (score >= 75) return { text: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200", bar: "bg-emerald-500", label: "Excellent Match" };
  if (score >= 50) return { text: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-200", bar: "bg-blue-500", label: "Good Match" };
  if (score >= 25) return { text: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200", bar: "bg-amber-500", label: "Fair Match" };
  return { text: "text-red-500", bg: "bg-red-50", ring: "ring-red-200", bar: "bg-red-400", label: "Needs Improvement" };
};

/**
 * Extract text from a PDF file entirely in the browser using pdfjs-dist.
 * This avoids the server-side DOMMatrix crash caused by pdf-parse on Vercel.
 */
async function extractPdfTextInBrowser(file) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => item.str).join(" ") + "\n";
  }

  const text = fullText.trim();
  if (!text) throw new Error("No readable text found in PDF. It may be image-based or scanned.");
  return text;
}

export default function ApplyJobModal({ isOpen, onClose, job }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [cvScore, setCvScore] = useState(null); // { overallScore, strengths, areasToImprove, ... }
  const [applied, setApplied] = useState(false);
  const [appliedScore, setAppliedScore] = useState(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!session) {
      toast.error("Please login first");
      router.push("/login");
      return;
    }

    setAnalyzing(true);
    try {
      // If user uploaded a new file, upload it to their profile first
      if (resumeFile) {
        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(resumeFile.type)) {
          toast.error("Only PDF and Word documents are allowed");
          setAnalyzing(false);
          return;
        }

        const formData = new FormData();
        formData.append("resume", resumeFile);
        const uploadRes = await fetch("/api/users/resume", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          toast.error("Failed to upload resume");
          setAnalyzing(false);
          return;
        }
      }

      // Strip HTML from job description
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = job.description || "";
      const plainDescription = tempDiv.textContent || tempDiv.innerText || "";

      // Resolve which file to analyze
      let fileToAnalyze = resumeFile;
      if (!fileToAnalyze) {
        // Fetch user's existing resume from their profile
        const userRes = await fetch("/api/users/me");
        const userData = await userRes.json();
        if (!userData.success || !userData.user?.resume) {
          toast.error("Please upload a resume first");
          setAnalyzing(false);
          return;
        }
        const resumeResponse = await fetch(userData.user.resume);
        if (!resumeResponse.ok) {
          toast.error("Could not read your resume file. Please upload a new one.");
          setAnalyzing(false);
          return;
        }
        const resumeBlob = await resumeResponse.blob();
        const fileName = userData.user.resume.split("/").pop() || "resume.pdf";
        fileToAnalyze = new File([resumeBlob], fileName, { type: resumeBlob.type || "application/pdf" });
      }

      const formData = new FormData();
      const ext = fileToAnalyze.name.split(".").pop()?.toLowerCase();

      if (ext === "pdf") {
        // Extract PDF text in the BROWSER to avoid server-side DOMMatrix crash on Vercel
        toast.loading("Reading PDF...", { id: "pdf-extract" });
        let pdfText;
        try {
          pdfText = await extractPdfTextInBrowser(fileToAnalyze);
          toast.dismiss("pdf-extract");
        } catch (pdfErr) {
          toast.dismiss("pdf-extract");
          toast.error(pdfErr.message || "Could not read PDF. Try a DOCX file instead.");
          setAnalyzing(false);
          return;
        }
        formData.append("resumeText", pdfText);
      } else {
        // DOCX / TXT — send raw file; server-side mammoth handles these fine
        formData.append("resumeFile", fileToAnalyze);
      }
      formData.append("jobDescription", plainDescription);

      const res = await fetch("/api/resume-analyzer", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.analysis) {
        setCvScore(data.analysis);
        toast.success("CV analysis complete!");
      } else {
        toast.error(data.message || "Analysis failed");
      }
    } catch (error) {
      console.error("CV analysis error:", error);
      toast.error("Failed to analyze CV. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = async () => {
    if (!session) {
      toast.error("Please login to apply for jobs");
      router.push("/login");
      return;
    }

    if (session?.user?.role !== "TalentSeeker") {
      toast.error("Only students can apply for jobs");
      return;
    }

    setLoading(true);
    try {
      // If user selected a new resume file and hasn't analyzed yet, upload it first
      if (resumeFile && !cvScore) {
        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(resumeFile.type)) {
          toast.error("Only PDF and Word documents are allowed");
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("resume", resumeFile);
        const uploadRes = await fetch("/api/users/resume", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          toast.error("Failed to upload resume");
          setLoading(false);
          return;
        }
      }

      // Proceed to apply for the job
      const applyRes = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job._id }),
      });

      const applyData = await applyRes.json();

      if (applyData.success) {
        setApplied(true);
        setAppliedScore(applyData.matchScore || cvScore?.overallScore || 0);
        toast.success("Successfully applied for the job!");
      } else {
        toast.error(applyData.message || "Failed to apply");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCvScore(null);
    setApplied(false);
    setAppliedScore(null);
    setResumeFile(null);
    onClose();
  };

  // --- SUCCESS STATE ---
  if (applied) {
    const score = appliedScore || 0;
    const colors = getScoreColor(score);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="text-emerald-500" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Application Submitted!</h2>
              <p className="text-sm text-gray-500">Your application for <strong>{job.title}</strong> has been submitted.</p>
            </div>

            {score > 0 && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}>
                <TrendingUp size={16} />
                <span className="text-sm font-bold">CV Match: {score}%</span>
                <span className="text-xs opacity-75">— {colors.label}</span>
              </div>
            )}

            <p className="text-xs text-gray-400">
              The recruiter can see your CV score. Higher scores get prioritized in the review queue.
            </p>

            <button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- CV SCORE PREVIEW STATE ---
  if (cvScore) {
    const score = cvScore.overallScore || 0;
    const colors = getScoreColor(score);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slideUp max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Your CV Score</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Score Ring */}
            <div className="flex items-center gap-5">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={score >= 75 ? "#10b981" : score >= 50 ? "#3b82f6" : score >= 25 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="10"
                    strokeDasharray={`${(score / 100) * 327} 327`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 1s ease-out" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-bold ${colors.text}`}>{score}%</span>
                </div>
              </div>
              <div>
                <h3 className={`text-lg font-bold ${colors.text}`}>{colors.label}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {score >= 75
                    ? "Your resume is well-aligned with this job!"
                    : score >= 50
                    ? "Good match — a few tweaks could boost your score."
                    : "Consider optimizing your resume before applying."}
                </p>
              </div>
            </div>

            {/* Quick Insights */}
            {cvScore.strengths?.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
                  ✅ Strengths
                </h4>
                <ul className="space-y-1">
                  {cvScore.strengths.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-xs text-emerald-800 flex items-start gap-1.5">
                      <CheckCircle size={12} className="mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {cvScore.areasToImprove?.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
                  ⚡ Areas to Improve
                </h4>
                <ul className="space-y-1">
                  {cvScore.areasToImprove.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                      <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Optimize Prompt */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <Sparkles className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Want a Higher Score?</h4>
                <p className="text-xs text-blue-600/80 mt-1 mb-2">
                  Get detailed AI recommendations to optimize your resume.
                </p>
                <Link
                  href="/student/resume-analyzer"
                  className="text-xs font-semibold bg-white text-blue-600 px-3 py-1.5 rounded shadow-sm inline-block hover:bg-blue-50 transition-colors"
                  onClick={handleClose}
                >
                  Full Analysis →
                </Link>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => setCvScore(null)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleApply}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? <><LoaderCircle size={16} className="animate-spin" /> Applying...</> : <>
                <ArrowRight size={16} /> Apply with {score}% Match
              </>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DEFAULT STATE (Upload + Analyze) ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Apply for Job</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-medium text-gray-800">{job.title}</h3>
            <p className="text-sm text-gray-500">{job.postedBy?.companyName || "Company"}</p>
          </div>

          {/* Resume Upload Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 block">Your Resume</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 hover:border-blue-300 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const allowedTypes = [
                      "application/pdf",
                      "application/msword",
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    ];
                    if (!allowedTypes.includes(file.type)) {
                      toast.error("Only PDF and Word documents are allowed");
                      e.target.value = "";
                      return;
                    }
                    if (file.size > 4 * 1024 * 1024) {
                      toast.error("File must be under 4MB");
                      e.target.value = "";
                      return;
                    }
                    setResumeFile(file);
                  }
                }}
              />
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              {resumeFile ? (
                <p className="text-sm font-medium text-blue-600 flex items-center justify-center gap-1">
                  <FileText size={16} /> {resumeFile.name}
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">Click to upload resume</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOCX up to 5MB</p>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500">
              * If you don&apos;t upload a new file, your profile&apos;s existing resume will be used.
            </p>
          </div>

          {/* CV Score Check Prompt */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <TrendingUp className="text-blue-500" size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Check Your CV Score First</h4>
                <p className="text-xs text-gray-500 mt-1">
                  See how well your resume matches this job before applying. Recruiters prioritize candidates by CV score!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-between gap-3">
          <button
            onClick={handleApply}
            disabled={loading || analyzing}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? <><LoaderCircle size={14} className="animate-spin inline mr-1" /> Applying...</> : "Skip & Apply"}
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || loading}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {analyzing ? (
              <><LoaderCircle size={16} className="animate-spin" /> Analyzing CV...</>
            ) : (
              <><Sparkles size={16} /> Check CV Score</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

