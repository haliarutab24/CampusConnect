"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LoaderCircle, CheckCircle, XCircle, FileText, ExternalLink, TrendingUp, ArrowUpDown } from "lucide-react";
import moment from "moment";

const getDisplayFilename = (url) => {
  if (!url) return "";
  const parts = url.split('/');
  const name = parts[parts.length - 1];
  
  if (name.match(/^[a-f0-9]{24}-\d+\.(pdf|doc|docx)$/i)) {
    return "Resume Document";
  }

  const match = name.match(/^\d+-(.+)$/);
  const cleanName = match ? match[1] : name;
  return cleanName.length > 20 ? cleanName.substring(0, 17) + "..." : cleanName;
};

const getScoreColor = (score) => {
  if (score >= 75) return { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", bar: "bg-emerald-500" };
  if (score >= 50) return { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200", bar: "bg-blue-500" };
  if (score >= 25) return { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", bar: "bg-amber-500" };
  return { bg: "bg-red-50", text: "text-red-600", ring: "ring-red-200", bar: "bg-red-400" };
};

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplicants = async () => {
    try {
      const res = await fetch("/api/companies/applicants");
      const data = await res.json();
      if (data.success) setApplicants(data.applicants);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchApplicants(); }, []);

  const handleStatusChange = async (appId, status) => {
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchApplicants();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoaderCircle className="animate-spin text-blue-500 w-8 h-8" /></div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Pending Applicants ({applicants.length})
        </h1>
        {applicants.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <TrendingUp size={13} />
            Sorted by CV match score
          </div>
        )}
      </div>

      {applicants.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center text-gray-500">
          No pending applications to review.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold text-gray-500 tracking-wider uppercase">
                  <th className="px-5 py-4">#</th>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Job Title</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4 text-center">
                    <span className="flex items-center justify-center gap-1">
                      CV Score <TrendingUp size={11} />
                    </span>
                  </th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-center">Resume</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {applicants.map((app, index) => {
                  const score = app.matchScore || 0;
                  const colors = getScoreColor(score);

                  return (
                    <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={(!app.applicant?.image || app.applicant?.image === "/profile_img.png") ? "/premium-avatar.png" : app.applicant?.image}
                            alt={app.applicant?.name}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                          />
                          <div>
                            <span className="font-medium text-gray-800 block">{app.applicant?.name}</span>
                            {app.applicant?.skills?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {app.applicant.skills.slice(0, 3).map((skill, i) => (
                                  <span key={i} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                    {skill}
                                  </span>
                                ))}
                                {app.applicant.skills.length > 3 && (
                                  <span className="text-[9px] text-gray-400">+{app.applicant.skills.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{app.job?.title}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{app.job?.location}</td>

                      {/* CV Score Column */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}>
                            {score}%
                          </span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${colors.bar}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-500">{moment(app.createdAt).format("MMM DD, YYYY")}</td>
                      <td className="px-5 py-4 text-center">
                        {app.applicant?.resume ? (
                          <a
                            href={app.applicant.resume}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            title={app.applicant.resume}
                          >
                            View {getDisplayFilename(app.applicant.resume)} <FileText size={12} />
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">No Resume</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleStatusChange(app._id, "Shortlisted")}
                            className="bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleStatusChange(app._id, "Rejected")}
                            className="bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
