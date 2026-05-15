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
                <tr className="text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Job Title</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 font-medium">Applicants</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Posted</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-800">{job.title}</td>
                    <td className="px-5 py-4 text-gray-600 flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400" /> {job.location}
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Users size={14} /> {job.applicants}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        job.status === "Open" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{moment(job.createdAt).format("ll")}</td>
                    <td className="px-5 py-4">
                      {job.status === "Open" ? (
                        <button
                          onClick={() => handleCloseJob(job.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle size={14} /> Close
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">Closed</span>
                      )}
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
