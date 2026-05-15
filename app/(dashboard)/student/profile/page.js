"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Upload, LoaderCircle } from "lucide-react";
import moment from "moment";

export default function StudentProfilePage() {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, appsRes] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/applications"),
        ]);
        const userData = await userRes.json();
        const appsData = await appsRes.json();
        if (userData.success) setUser(userData.user);
        if (appsData.success) setApplications(appsData.applications);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch("/api/users/resume", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        toast.success("Resume uploaded!");
        setUser((prev) => ({ ...prev, resume: data.resumeUrl }));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderCircle className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <img
            src={(!user?.image || user?.image === "/profile_img.png") ? "/premium-avatar.png" : user?.image}
            alt={user?.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
          />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <p className="text-sm text-gray-600 mt-2">{user?.bio || "No bio provided"}</p>

            {user?.skills?.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, i) => (
                    <span key={i} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume */}
            <div className="mt-4 flex items-center gap-3">
              {user?.resume ? (
                <a
                  href={user.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  📄 View Resume
                </a>
              ) : (
                <span className="text-sm text-gray-400">No resume uploaded</span>
              )}
              <label className="flex items-center gap-1 text-sm text-blue-600 cursor-pointer hover:underline">
                <Upload size={14} />
                {uploading ? "Uploading..." : "Upload Resume"}
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Applications ({applications.length})
        </h2>
        {applications.length === 0 ? (
          <p className="text-gray-500">No applications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Job</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 10).map((app) => (
                  <tr key={app._id} className="border-b last:border-b-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <img src={app.recruiter?.image || "/company.webp"} alt="" className="w-7 h-7 rounded-full object-cover" />
                        {app.recruiter?.companyName || app.recruiter?.name}
                      </div>
                    </td>
                    <td className="py-3 text-gray-700">{app.job?.title}</td>
                    <td className="py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        app.status === "Shortlisted" || app.status === "Accepted"
                          ? "bg-green-50 text-green-600"
                          : app.status === "Rejected"
                          ? "bg-red-50 text-red-500"
                          : app.status === "Closed"
                          ? "bg-gray-100 text-gray-500"
                          : "bg-blue-50 text-blue-600"
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{moment(app.createdAt).format("ll")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
