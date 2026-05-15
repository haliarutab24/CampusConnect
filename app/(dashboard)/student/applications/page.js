"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import moment from "moment";

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await fetch("/api/applications");
        const data = await res.json();
        if (data.success) setApplications(data.applications);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const statuses = ["All", "Pending", "Shortlisted", "Accepted", "Rejected", "Closed"];
  const filtered = filter === "All" ? applications : applications.filter((a) => a.status === filter);

  if (loading) return <div className="flex items-center justify-center h-64"><LoaderCircle className="animate-spin text-blue-500 w-8 h-8" /></div>;

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Applications</h1>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              filter === s ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-gray-500">
          No {filter !== "All" ? filter.toLowerCase() : ""} applications found.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Job Title</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Match</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <img src={app.recruiter?.image || "/company.webp"} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <span className="text-gray-800 font-medium">{app.recruiter?.companyName || app.recruiter?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-800">{app.job?.title}</td>
                    <td className="px-5 py-4 text-gray-600">{app.job?.location}</td>
                    <td className="px-5 py-4 text-gray-600">{app.job?.category}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium ${app.matchScore >= 60 ? "text-green-600" : "text-gray-500"}`}>
                        {app.matchScore || 0}%
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        app.status === "Shortlisted" || app.status === "Accepted" ? "bg-green-50 text-green-600"
                          : app.status === "Rejected" ? "bg-red-50 text-red-500"
                          : app.status === "Closed" ? "bg-gray-100 text-gray-500"
                          : "bg-blue-50 text-blue-600"
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{moment(app.createdAt).format("ll")}</td>
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
