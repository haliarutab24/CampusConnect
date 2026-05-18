"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LoaderCircle, MapPin, Users, XCircle, Eye } from "lucide-react";
import moment from "moment";
import Link from "next/link";

export default function ManageJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/companies/jobs");
      const data = await res.json();
      if (data.success) setJobs(data.jobs);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleCloseJob = async (jobId) => {
    if (!confirm("Are you sure you want to close this job? All applicants will be notified.")) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}/close`, { method: "PUT" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchJobs();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to close job");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoaderCircle className="animate-spin text-blue-500 w-8 h-8" /></div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Manage Jobs</h1>
        <Link
          href="/recruiter/add-job"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
        >
          + Post New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-gray-500 mb-4">No jobs posted yet.</p>
          <Link href="/recruiter/add-job" className="text-blue-600 hover:underline font-medium">Post your first job →</Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold text-gray-500 tracking-wider uppercase">
                  <th className="px-5 py-4">#</th>
                  <th className="px-5 py-4">Job Title</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-center">Applicants</th>
                  <th className="px-5 py-4 text-center">Visible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {jobs.map((job, index) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-800">{job.title}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{job.location}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{moment(job.createdAt).format("MMM DD, YYYY")}</td>
                    <td className="px-5 py-4 text-sm text-center">
                      <span className="text-blue-600 font-medium">{job.applicants}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={job.status === "Open"} 
                        onChange={() => {
                          if (job.status === "Open") handleCloseJob(job.id);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        disabled={job.status !== "Open"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
