"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LoaderCircle, CheckCircle, XCircle, FileText, Star, Video, X, Calendar, ExternalLink } from "lucide-react";
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

export default function ShortlistedPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interviewModal, setInterviewModal] = useState(null); // { appId, link, scheduledAt, saving }

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

  const handleSaveInterview = async () => {
    if (!interviewModal) return;
    const { appId, link, scheduledAt } = interviewModal;

    if (!link || !link.trim()) {
      toast.error("Please enter a Google Meet link");
      return;
    }

    setInterviewModal((prev) => ({ ...prev, saving: true }));

    try {
      const res = await fetch(`/api/applications/${appId}/interview`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewLink: link.trim(),
          interviewScheduledAt: scheduledAt || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setInterviewModal(null);
        fetchShortlisted();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to save interview details");
    } finally {
      setInterviewModal((prev) => prev ? { ...prev, saving: false } : null);
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
                  <th className="px-5 py-4 text-center">Interview</th>
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

                    {/* Interview Column */}
                    <td className="px-5 py-4 text-center">
                      {app.interviewLink ? (
                        <div className="flex flex-col items-center gap-1">
                          <a
                            href={app.interviewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-blue-500 text-white hover:bg-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all animate-pulse-glow cursor-pointer"
                          >
                            <Video size={13} /> Join Meet
                          </a>
                          {app.interviewScheduledAt && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Calendar size={9} /> {moment(app.interviewScheduledAt).format("MMM DD, h:mm A")}
                            </span>
                          )}
                        </div>
                      ) : app.status === "Shortlisted" && app.booking ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                            Candidate booked, link pending
                          </span>
                          {app.interviewScheduledAt && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Calendar size={9} /> {moment(app.interviewScheduledAt).format("MMM DD, h:mm A")}
                            </span>
                          )}
                          <button
                            onClick={() => setInterviewModal({ appId: app._id, link: "", scheduledAt: app.interviewScheduledAt ? moment(app.interviewScheduledAt).format("YYYY-MM-DDTHH:mm") : "", saving: false })}
                            className="inline-flex items-center gap-1 text-gray-400 hover:text-blue-600 text-[10px] transition-colors cursor-pointer"
                            title="Add a meeting link"
                          >
                            <Video size={10} /> Add link manually
                          </button>
                        </div>
                      ) : app.status === "Shortlisted" ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                            Awaiting candidate booking
                          </span>
                          <button
                            onClick={() => setInterviewModal({ appId: app._id, link: "", scheduledAt: "", saving: false })}
                            className="inline-flex items-center gap-1 text-gray-400 hover:text-blue-600 text-[10px] transition-colors cursor-pointer"
                            title="Manually set a Meet link"
                          >
                            <Video size={10} /> Add link manually
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {app.status === "Shortlisted" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleStatusChange(app._id, "Accepted")}
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
                      ) : (
                        <div className="text-center">
                          <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded text-xs font-medium inline-block">
                            Accepted
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Interview Link Modal (Fallback) */}
      {interviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
            onClick={() => setInterviewModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Video className="text-blue-500" size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Manual Meet Link</h3>
                  <p className="text-xs text-gray-400">Add a link for candidates who can&apos;t auto-book</p>
                </div>
              </div>
              <button
                onClick={() => setInterviewModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-700 leading-relaxed">
                💡 <span className="font-semibold">Tip:</span> Candidates can auto-book interview slots from their dashboard if you&apos;ve set up your availability. Use this manual option only as a fallback.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Google Meet URL</label>
              <input
                type="url"
                placeholder="https://meet.google.com/abc-defg-hij"
                value={interviewModal.link}
                onChange={(e) => setInterviewModal((prev) => ({ ...prev, link: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-gray-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Scheduled Time <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={interviewModal.scheduledAt}
                onChange={(e) => setInterviewModal((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-gray-600"
              />
            </div>

            <button
              onClick={handleSaveInterview}
              disabled={interviewModal.saving}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all cursor-pointer"
            >
              {interviewModal.saving ? (
                <>
                  <LoaderCircle className="animate-spin" size={16} /> Saving...
                </>
              ) : (
                <>
                  <Calendar size={16} /> Save & Notify Candidate
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
