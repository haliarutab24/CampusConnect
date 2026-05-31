"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Clock, MapPin, Briefcase, IndianRupee, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";
import moment from "moment";
import Link from "next/link";
import JobCard from "@/components/jobs/JobCard";

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [job, setJob] = useState(null);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [matchScore, setMatchScore] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        const data = await res.json();
        if (data.success) {
          setJob(data.job);
          // Fetch similar jobs
          const allRes = await fetch("/api/jobs");
          const allData = await allRes.json();
          if (allData.success) {
            const similar = allData.jobs.filter(
              (j) => j._id !== id && (j.postedBy?.name === data.job.postedBy?.name || j.category === data.job.category)
            ).slice(0, 3);
            setSimilarJobs(similar);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  // Check if already applied
  useEffect(() => {
    if (!session?.user || session.user.role !== "TalentSeeker") return;
    const checkApplied = async () => {
      try {
        const res = await fetch("/api/applications");
        const data = await res.json();
        if (data.success) {
          const existingApp = data.applications.find((app) => app.job?._id === id);
          if (existingApp) {
            setAlreadyApplied(true);
            setMatchScore(existingApp.matchScore || 0);
          }
        }
      } catch {}
    };
    checkApplied();
  }, [session, id]);

  const handleApply = async () => {
    if (!session?.user) {
      router.push("/login");
      return toast.error("Please login to apply");
    }
    if (session.user.role !== "TalentSeeker") {
      return toast.error("Only students can apply for jobs");
    }

    setApplying(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: id }),
      });
      const data = await res.json();
      if (data.success) {
        const score = data.matchScore || 0;
        setMatchScore(score);
        toast.success(`Applied successfully! CV Match: ${score}%`);
        setAlreadyApplied(true);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-100 rounded-xl"></div>
          <div className="h-64 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Job Not Found</h2>
        <Link href="/all-jobs" className="text-blue-600 hover:underline">Browse all jobs</Link>
      </div>
    );
  }

  const company = job.postedBy || {};

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-10 py-8">
      {/* Back Button */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 cursor-pointer">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Job Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 lg:p-12 mb-8">
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 flex-shrink-0 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm">
              <img
                src={company.image || "/company.webp"}
                alt={company.companyName || company.name}
                className="w-14 h-14 object-cover rounded-lg"
              />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-3">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Briefcase size={16} className="text-blue-500" />
                  {company.companyName || company.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-green-500" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <IndianRupee size={16} className="text-amber-500" />
                  RS. {job.salary ? `${(job.salary / 1000).toFixed(0)}K` : "Not disclosed"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">{job.category}</span>
                <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">{job.level}</span>
                {job.status === "Closed" && (
                  <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium">Closed</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-3">
            <button
              className={`px-8 py-3 rounded-xl font-medium transition-all shadow-sm ${
                alreadyApplied || job.status === "Closed"
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 cursor-pointer hover:shadow-lg"
              }`}
              onClick={handleApply}
              disabled={alreadyApplied || applying || job.status === "Closed"}
            >
              {applying ? "Analyzing & Applying..." : alreadyApplied ? "Already Applied ✓" : job.status === "Closed" ? "Job Closed" : "Apply Now"}
            </button>
            {alreadyApplied && matchScore !== null && (
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                matchScore >= 75 ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                : matchScore >= 50 ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
                : matchScore >= 25 ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                : "bg-red-50 text-red-500 ring-1 ring-red-200"
              }`}>
                CV Match: {matchScore}%
              </span>
            )}
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <Clock size={14} />
              Posted {moment(job.createdAt).fromNow()}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Job Description</h2>
          <div
            className="job-description text-gray-700 leading-relaxed prose max-w-none"
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
          {job.tags?.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold text-gray-800 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag, i) => (
                  <span key={i} className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Similar Jobs Sidebar */}
        <div className="lg:w-96">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Similar Jobs
          </h2>
          <div className="space-y-4">
            {similarJobs.length > 0 ? (
              similarJobs.map((j) => <JobCard key={j._id} job={j} />)
            ) : (
              <p className="text-gray-500 text-sm">No similar jobs found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
