"use client";

import { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  Sparkles, LoaderCircle, CheckCircle, AlertTriangle, Target,
  TrendingUp, FileText, Zap, ArrowRight, Upload, X, FileUp, Type,
} from "lucide-react";

const ACCEPTED_FILE_TYPES = ".pdf,.docx,.doc,.txt,.text,.md";
const MAX_FILE_SIZE_MB = 4;

// Extract text from a PDF file using pdfjs-dist IN THE BROWSER
// This avoids server-side DOMMatrix crashes on Vercel serverless
async function extractPdfTextInBrowser(file) {
  const pdfjs = await import("pdfjs-dist");

  // Use jsDelivr CDN with exact version — avoids worker URL issues
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

export default function ResumeAnalyzerPage() {
  const [inputMode, setInputMode] = useState("upload"); // "upload" or "paste"
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedFileName, setExtractedFileName] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    // Validate file type
    const ext = file.name.split(".").pop()?.toLowerCase();
    const validExts = ["pdf", "docx", "doc", "txt", "text", "md"];
    if (!validExts.includes(ext)) {
      toast.error("Unsupported format. Use PDF, DOCX, or TXT files.");
      return;
    }

    setResumeFile(file);
    setExtractedFileName(file.name);
  };

  const removeFile = () => {
    setResumeFile(null);
    setExtractedFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getFileIcon = (name) => {
    const ext = name?.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📄";
    if (ext === "docx" || ext === "doc") return "📝";
    return "📃";
  };

  const handleAnalyze = async () => {
    const hasResume = inputMode === "upload" ? !!resumeFile : !!resumeText.trim();
    if (!hasResume) {
      return toast.error(
        inputMode === "upload"
          ? "Please upload a resume file"
          : "Please paste your resume text"
      );
    }
    if (!jobDescription.trim()) {
      return toast.error("Please provide a job description");
    }

    setLoading(true);
    setAnalysis(null);

    try {
      let textToAnalyze = resumeText;

      if (inputMode === "upload" && resumeFile) {
        const ext = resumeFile.name.split(".").pop()?.toLowerCase();

        if (ext === "pdf") {
          // Extract PDF text IN THE BROWSER — avoids all server-side PDF parser issues
          toast.loading("Reading PDF...", { id: "pdf-extract" });
          try {
            textToAnalyze = await extractPdfTextInBrowser(resumeFile);
            toast.dismiss("pdf-extract");
          } catch (pdfErr) {
            toast.dismiss("pdf-extract");
            toast.error(pdfErr.message || "Could not read PDF. Try pasting the text instead.");
            setLoading(false);
            return;
          }
        } else {
          // For DOCX/TXT — send file to server (mammoth works fine server-side)
          const formData = new FormData();
          formData.append("resumeFile", resumeFile);
          formData.append("jobDescription", jobDescription);
          const res = await fetch("/api/resume-analyzer", { method: "POST", body: formData });
          const data = await res.json();
          if (data.success) {
            setAnalysis(data.analysis);
            toast.success("Analysis complete!");
          } else {
            toast.error(data.message);
          }
          return;
        }
      }

      // Send extracted text (from PDF browser extraction or pasted text) to server
      const formData = new FormData();
      formData.append("resumeText", textToAnalyze);
      formData.append("jobDescription", jobDescription);
      const res = await fetch("/api/resume-analyzer", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        setAnalysis(data.analysis);
        toast.success("Analysis complete!");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-500";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="text-blue-500" />
          AI Resume Analyzer
        </h1>
        <p className="text-gray-500 mt-1">
          Upload your resume or paste text, then compare it against a job description
        </p>
      </div>

      {/* Input Section */}
      {!analysis && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Resume Input */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                Resume / CV
              </h2>
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setInputMode("upload")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    inputMode === "upload"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FileUp size={13} />
                  Upload
                </button>
                <button
                  onClick={() => setInputMode("paste")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    inputMode === "paste"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Type size={13} />
                  Paste
                </button>
              </div>
            </div>

            {inputMode === "upload" ? (
              /* File Upload Area */
              <div className="space-y-3">
                {!resumeFile ? (
                  <label className="cursor-pointer block">
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
                      <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                        <Upload
                          size={24}
                          className="text-blue-500"
                        />
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Drop your resume here or click to browse
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF, DOCX, or TXT — Max {MAX_FILE_SIZE_MB}MB
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_FILE_TYPES}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  /* File Preview */
                  <div className="border border-green-200 bg-green-50/50 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border border-green-100 rounded-lg flex items-center justify-center text-2xl shadow-sm">
                      {getFileIcon(extractedFileName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {extractedFileName}
                      </p>
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                        <CheckCircle size={12} />
                        Ready for analysis
                      </p>
                    </div>
                    <button
                      onClick={removeFile}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Supported formats hint */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { ext: "PDF", color: "bg-red-50 text-red-600" },
                    { ext: "DOCX", color: "bg-blue-50 text-blue-600" },
                    { ext: "TXT", color: "bg-gray-100 text-gray-600" },
                  ].map((f) => (
                    <span
                      key={f.ext}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${f.color}`}
                    >
                      .{f.ext.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              /* Paste Text Area */
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume content here..."
                rows={14}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            )}
          </div>

          {/* Job Description */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Target size={18} className="text-indigo-500" />
              Job Description
            </h2>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={14}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>
      )}

      {!analysis && (
        <div className="flex justify-center">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="animate-spin" /> Analyzing
                with AI...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Analyze Resume
              </>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-6 animate-fadeIn">
          {/* Back Button */}
          <button
            onClick={() => setAnalysis(null)}
            className="text-sm text-blue-600 hover:underline cursor-pointer"
          >
            ← Analyze Another Resume
          </button>

          {/* Overall Score */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg
                  className="w-full h-full -rotate-90"
                  viewBox="0 0 120 120"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="white"
                    strokeWidth="10"
                    strokeDasharray={`${(analysis.overallScore / 100) * 327} 327`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">
                    {analysis.overallScore}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Overall Match Score</h2>
                <p className="text-blue-100">
                  {analysis.overallScore >= 80
                    ? "Excellent match! Your resume is well-aligned with this role."
                    : analysis.overallScore >= 60
                    ? "Good match with room for improvement."
                    : analysis.overallScore >= 40
                    ? "Moderate match. Consider the improvements below."
                    : "Low match. Significant improvements needed."}
                </p>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid md:grid-cols-3 gap-4">
            {analysis.scoreBreakdown &&
              Object.entries(analysis.scoreBreakdown).map(([key, val]) => (
                <div
                  key={key}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </h3>
                    <span
                      className={`text-lg font-bold ${getScoreColor(val.score)}`}
                    >
                      {val.score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full ${getScoreBg(val.score)} transition-all duration-500`}
                      style={{ width: `${val.score}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">{val.feedback}</p>
                </div>
              ))}
          </div>

          {/* ATS Compatibility */}
          {analysis.atsCompatibility && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  ATS Compatibility
                </h3>
                <span
                  className={`text-xl font-bold ${getScoreColor(analysis.atsCompatibility.score)}`}
                >
                  {analysis.atsCompatibility.score}%
                </span>
              </div>
              {analysis.atsCompatibility.issues?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-red-600 mb-2">
                    ⚠️ Issues Found
                  </h4>
                  <ul className="space-y-1">
                    {analysis.atsCompatibility.issues.map((issue, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-600 flex items-start gap-2"
                      >
                        <AlertTriangle
                          size={14}
                          className="text-amber-500 mt-0.5 flex-shrink-0"
                        />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.atsCompatibility.suggestions?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-2">
                    💡 Suggestions
                  </h4>
                  <ul className="space-y-1">
                    {analysis.atsCompatibility.suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-600 flex items-start gap-2"
                      >
                        <CheckCircle
                          size={14}
                          className="text-green-500 mt-0.5 flex-shrink-0"
                        />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Keywords */}
          {analysis.keywordOptimization && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-green-700 mb-3">
                  ✅ Present Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywordOptimization.presentKeywords?.map(
                    (kw, i) => (
                      <span
                        key={i}
                        className="bg-green-50 text-green-600 text-xs px-2.5 py-1 rounded-full"
                      >
                        {kw}
                      </span>
                    )
                  )}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-red-600 mb-3">
                  ❌ Missing Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywordOptimization.missingKeywords?.map(
                    (kw, i) => (
                      <span
                        key={i}
                        className="bg-red-50 text-red-500 text-xs px-2.5 py-1 rounded-full"
                      >
                        {kw}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Plan */}
          {analysis.actionPlan && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="text-amber-500" size={20} />
                Action Plan
              </h3>
              {analysis.actionPlan.highImpact?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-red-600 mb-3 uppercase tracking-wider">
                    🔴 High Impact
                  </h4>
                  <div className="space-y-3">
                    {analysis.actionPlan.highImpact.map((item, i) => (
                      <div
                        key={i}
                        className="bg-red-50/50 border border-red-100 rounded-lg p-4"
                      >
                        <p className="font-medium text-gray-800 mb-1">
                          {item.action}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.reason}
                        </p>
                        {item.example && (
                          <p className="text-xs text-gray-500 bg-white p-2 rounded border italic">
                            Example: {item.example}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analysis.actionPlan.mediumImpact?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-amber-600 mb-3 uppercase tracking-wider">
                    🟡 Medium Impact
                  </h4>
                  <div className="space-y-3">
                    {analysis.actionPlan.mediumImpact.map((item, i) => (
                      <div
                        key={i}
                        className="bg-amber-50/50 border border-amber-100 rounded-lg p-4"
                      >
                        <p className="font-medium text-gray-800 mb-1">
                          {item.action}
                        </p>
                        <p className="text-sm text-gray-600">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid md:grid-cols-2 gap-4">
            {analysis.strengths?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <TrendingUp size={18} /> Strengths
                </h3>
                <ul className="space-y-2">
                  {analysis.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <CheckCircle
                        size={14}
                        className="text-green-500 mt-0.5 flex-shrink-0"
                      />{" "}
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.areasToImprove?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                  <AlertTriangle size={18} /> Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {analysis.areasToImprove.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <ArrowRight
                        size={14}
                        className="text-amber-500 mt-0.5 flex-shrink-0"
                      />{" "}
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* STAR Method Suggestions */}
          {analysis.starMethodSuggestions?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📝 STAR Method Improvements
              </h3>
              <div className="space-y-4">
                {analysis.starMethodSuggestions.map((s, i) => (
                  <div
                    key={i}
                    className="border border-gray-100 rounded-lg p-4"
                  >
                    <p className="text-sm text-red-500 line-through mb-2">
                      {s.currentBullet}
                    </p>
                    <p className="text-sm text-green-700 font-medium">
                      → {s.improvedVersion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
