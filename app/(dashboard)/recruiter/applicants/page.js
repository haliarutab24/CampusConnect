"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LoaderCircle, CheckCircle, XCircle, FileText, ExternalLink } from "lucide-react";
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
      <h1 className="text-2xl font-bold text-gray-800">
        Pending Applicants ({applicants.length})
      </h1>

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
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-center">Resume</th>
                  <th className="px-5 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {applicants.map((app, index) => (
                  <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={(!app.applicant?.image || app.applicant?.image === "/profile_img.png") ? "/premium-avatar.png" : app.applicant?.image}
                          alt={app.applicant?.name}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                        <span className="font-medium text-gray-800">{app.applicant?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{app.job?.title}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{app.job?.location}</td>
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
                          className="bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusChange(app._id, "Rejected")}
                          className="bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </div>
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
