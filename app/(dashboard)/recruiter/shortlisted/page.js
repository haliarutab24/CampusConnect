"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LoaderCircle, CheckCircle, XCircle, FileText, Star } from "lucide-react";

export default function ShortlistedPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchShortlisted = async () => {
    try {
      const res = await fetch("/api/companies/applicants/shortlisted");
      const data = await res.json();
      if (data.success) setApplicants(data.applicants);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchShortlisted(); }, []);

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
        fetchShortlisted();
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
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Star className="text-amber-500" size={24} />
        Shortlisted & Accepted ({applicants.length})
      </h1>

      {applicants.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center text-gray-500">
          No shortlisted or accepted applicants yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {applicants.map((app) => (
            <div key={app._id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-start gap-4">
                  <img
                    src={(!app.applicant?.image || app.applicant?.image === "/profile_img.png") ? "/premium-avatar.png" : app.applicant?.image}
                    alt={app.applicant?.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-green-100"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">{app.applicant?.name}</h3>
                    <p className="text-sm text-gray-500">{app.applicant?.email}</p>
                    <p className="text-sm text-blue-600 mt-1">
                      {app.job?.title} • {app.job?.location}
                    </p>
                    {app.applicant?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {app.applicant.skills.map((s, i) => (
                          <span key={i} className="bg-green-50 text-green-600 text-[10px] px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        app.status === "Accepted" ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-600"
                      }`}>
                        {app.status}
                      </span>
                      {app.applicant?.resume && (
                        <a href={app.applicant.resume} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <FileText size={12} /> Resume
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {app.status === "Shortlisted" && (
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => handleStatusChange(app._id, "Accepted")}
                      className="flex items-center gap-1 bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                    >
                      <CheckCircle size={14} /> Accept
                    </button>
                    <button
                      onClick={() => handleStatusChange(app._id, "Rejected")}
                      className="flex items-center gap-1 bg-red-50 text-red-500 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
