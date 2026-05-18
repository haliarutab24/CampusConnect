"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { X, Upload, FileText, Sparkles, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ApplyJobModal({ isOpen, onClose, job }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);

  if (!isOpen) return null;

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
      // If user selected a new resume file, upload it first
      if (resumeFile) {
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
          method: "POST", // or PUT depending on the endpoint
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
        toast.success("Successfully applied for the job!");
        onClose();
      } else {
        toast.error(applyData.message || "Failed to apply");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Apply for Job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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
              * If you don't upload a new file, your profile's existing resume will be used.
            </p>
          </div>

          {/* Analyze Option */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Sparkles className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Optimize Your Resume</h4>
              <p className="text-xs text-blue-600/80 mt-1 mb-2">
                Check your ATS score and get AI recommendations before applying!
              </p>
              <Link 
                href="/student/resume-analyzer"
                className="text-xs font-semibold bg-white text-blue-600 px-3 py-1.5 rounded shadow-sm inline-block hover:bg-blue-50 transition-colors"
                onClick={onClose}
              >
                Analyze Resume Now
              </Link>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50"
          >
            {loading ? <><LoaderCircle size={16} className="animate-spin" /> Applying...</> : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}
