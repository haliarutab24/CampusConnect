"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Upload, LoaderCircle, Eye, Edit, Trash2, X, MapPin, Mail, Briefcase, User as UserIcon, FileText as FileTextIcon, Camera } from "lucide-react";
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
  return cleanName.length > 25 ? cleanName.substring(0, 22) + "..." : cleanName;
};

const PAKISTAN_CITIES = [
  "Abbottabad", "Bahawalpur", "Faisalabad", "Gujranwala", "Hyderabad", 
  "Islamabad", "Karachi", "Lahore", "Larkana", "Mirpur Khas", "Multan", 
  "Nawabshah", "Peshawar", "Quetta", "Rawalpindi", "Sargodha", "Sialkot", "Sukkur"
];

export default function StudentProfilePage() {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // CRUD State
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalMode, setModalMode] = useState(""); // "view", "edit", "delete", ""
  const [editMessage, setEditMessage] = useState("");
  const [editResumeFile, setEditResumeFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Profile State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isViewCoverLetterOpen, setIsViewCoverLetterOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [profileData, setProfileData] = useState({
    name: "", title: "", location: "", bio: "", coverLetter: "", skills: []
  });

  const handleEditProfileOpen = () => {
    setProfileData({
      name: user?.name || "",
      title: user?.title || "",
      location: user?.location || "",
      bio: user?.bio || "",
      coverLetter: user?.coverLetter || "",
      skills: user?.skills || []
    });
    setSkillInput("");
    setIsEditProfileOpen(true);
  };

  const handleProfileSave = async () => {
    setActionLoading(true);
    try {
      const formData = new FormData();
      Object.entries(profileData).forEach(([key, value]) => {
        if (key === "skills") {
          formData.append(key, value.join(","));
        } else {
          formData.append(key, value);
        }
      });

      const res = await fetch("/api/users/me", { method: "PUT", body: formData });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated!");
        setUser(data.user);
        setIsEditProfileOpen(false);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCoverLetter = async () => {
    try {
      const formData = new FormData();
      formData.append("coverLetter", "");
      const res = await fetch("/api/users/me", { method: "PUT", body: formData });
      const data = await res.json();
      if (data.success) {
        toast.success("Cover letter deleted");
        setUser(data.user);
      }
    } catch {
      toast.error("Failed to delete cover letter");
    }
  };

  const handleDeleteResume = async () => {
    try {
      const formData = new FormData();
      formData.append("resume", "");
      const res = await fetch("/api/users/me", { method: "PUT", body: formData });
      const data = await res.json();
      if (data.success) {
        toast.success("Resume deleted");
        setUser(data.user);
      }
    } catch {
      toast.error("Failed to delete resume");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/users/me", { method: "PUT", body: formData });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile picture updated!");
        setUser(data.user);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to update profile picture");
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageDelete = async () => {
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("deleteImage", "true");
      const res = await fetch("/api/users/me", { method: "PUT", body: formData });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile picture removed");
        setUser(data.user);
      }
    } catch {
      toast.error("Failed to remove profile picture");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSkillAdd = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !profileData.skills.includes(val)) {
        setProfileData({ ...profileData, skills: [...profileData.skills, val] });
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfileData({ ...profileData, skills: profileData.skills.filter(s => s !== skillToRemove) });
  };

  const openModal = (app, mode) => {
    setSelectedApp(app);
    setModalMode(mode);
    setEditMessage(app.message || "");
    setEditResumeFile(null);
  };

  const closeModal = () => {
    setSelectedApp(null);
    setModalMode("");
    setEditMessage("");
    setEditResumeFile(null);
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/applications/${selectedApp._id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Application withdrawn");
        setApplications(prev => prev.filter(a => a._id !== selectedApp._id));
        closeModal();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to delete application");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    setActionLoading(true);
    try {
      let newResumeUrl = selectedApp.resumeLink;
      
      // Upload new resume if selected
      if (editResumeFile) {
        const formData = new FormData();
        formData.append("resume", editResumeFile);
        const uploadRes = await fetch("/api/users/resume", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          newResumeUrl = uploadData.resumeUrl;
        } else {
          toast.error("Failed to upload new resume");
          setActionLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/applications/${selectedApp._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: editMessage, resumeLink: newResumeUrl }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Application updated");
        setApplications(prev => prev.map(a => a._id === selectedApp._id ? { ...a, message: editMessage, resumeLink: newResumeUrl } : a));
        closeModal();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to update application");
    } finally {
      setActionLoading(false);
    }
  };

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

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF and Word documents are allowed");
      e.target.value = ""; // reset input
      return;
    }

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
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative">
        <button 
          onClick={handleEditProfileOpen}
          className="absolute top-6 right-6 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
          title="Edit Profile"
        >
          <Edit size={20} />
        </button>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative group shrink-0">
            <div className={`w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100 relative ${imageUploading ? 'opacity-50' : ''}`}>
              <img
                src={(!user?.image || user?.image === "/profile_img.png") ? "/premium-avatar.png" : user?.image}
                alt={user?.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer text-white p-2 rounded-full hover:bg-white/20 transition-colors" title="Change Photo">
                  <Camera size={20} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
            {user?.image && user?.image !== "/premium-avatar.png" && user?.image !== "/profile_img.png" && (
              <button 
                onClick={handleImageDelete}
                className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-sm opacity-0 group-hover:opacity-100 z-10"
                title="Remove photo"
              >
                <Trash2 size={12} />
              </button>
            )}
            {imageUploading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <LoaderCircle className="animate-spin text-blue-600" size={24} />
              </div>
            )}
          </div>
          <div className="flex-1 w-full pr-8">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{user?.name}</h2>
            {user?.title && (
              <p className="text-blue-600 font-medium text-[15px] flex items-center gap-1.5 mt-1">
                <Briefcase size={16} /> {user.title}
              </p>
            )}
            
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 mb-5 border-b border-gray-100 pb-5">
              <p className="text-gray-500 text-sm flex items-center gap-1.5">
                <Mail size={15} /> {user?.email}
              </p>
              {user?.location && (
                <p className="text-gray-500 text-sm flex items-center gap-1.5">
                  <MapPin size={15} /> {user.location}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {user?.bio && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mb-2">
                      <UserIcon size={16} className="text-blue-500" /> About Me
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
                  </div>
                )}
                
                {/* Default Cover Letter */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Default Cover Letter</h3>
                  <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {user?.coverLetter ? (
                      <button 
                        onClick={() => setIsViewCoverLetterOpen(true)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2 cursor-pointer"
                      >
                        <FileTextIcon size={16} /> View Cover Letter
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">No cover letter added</span>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <button 
                        onClick={handleEditProfileOpen} 
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
                      >
                        {user?.coverLetter ? <Edit size={14} /> : <span className="text-base leading-none">+</span>}
                        {user?.coverLetter ? "Update" : "Add Letter"}
                      </button>
                      {user?.coverLetter && (
                        <button 
                          onClick={handleDeleteCoverLetter} 
                          className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-white border border-red-100 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors shadow-sm"
                          title="Delete Cover Letter"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {user?.skills?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Core Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, i) => (
                        <span key={i} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm cursor-default">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Resume Document</h3>
                  <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {user?.resume ? (
                      <a
                        href={user.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2"
                      >
                        <FileTextIcon size={16} /> {getDisplayFilename(user.resume)}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">No resume uploaded</span>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm mb-0">
                        {user?.resume ? <Edit size={14} /> : <span className="text-base leading-none">+</span>}
                        {uploading ? "..." : user?.resume ? "Edit" : "Upload"}
                        <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleResumeUpload} className="hidden" />
                      </label>
                      {user?.resume && (
                        <button 
                          onClick={handleDeleteResume} 
                          className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-white border border-red-100 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors shadow-sm"
                          title="Delete Resume"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
                  <th className="pb-3 font-medium text-right">Actions</th>
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
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openModal(app, "view")} className="text-gray-400 hover:text-blue-500 transition-colors cursor-pointer" title="View Application">
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => openModal(app, "edit")} 
                          className={`transition-colors cursor-pointer ${["Accepted", "Rejected"].includes(app.status) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-green-500'}`}
                          disabled={["Accepted", "Rejected"].includes(app.status)}
                          title="Edit Message"
                        >
                          <Edit size={18} />
                        </button>
                        <button onClick={() => openModal(app, "delete")} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer" title="Withdraw Application">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRUD Modals */}
      {modalMode && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {modalMode === "view" ? "Application Details" : modalMode === "edit" ? "Edit Application" : "Withdraw Application"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {modalMode === "view" && (
                <div className="space-y-3 text-sm">
                  <p><strong className="text-gray-700 block mb-1">Company</strong> {selectedApp.recruiter?.companyName || selectedApp.recruiter?.name}</p>
                  <p><strong className="text-gray-700 block mb-1">Job Title</strong> {selectedApp.job?.title}</p>
                  <p><strong className="text-gray-700 block mb-1">Status</strong> <span className="font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">{selectedApp.status}</span></p>
                  <p><strong className="text-gray-700 block mb-1">Applied on</strong> {moment(selectedApp.createdAt).format("LL")}</p>
                  {selectedApp.matchScore > 0 && (
                    <p><strong className="text-gray-700 block mb-1">Match Score</strong> {selectedApp.matchScore}%</p>
                  )}
                  {selectedApp.message && (
                    <div>
                      <strong className="text-gray-700 block mb-1">Cover Letter / Message</strong>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-600 whitespace-pre-wrap">
                        {selectedApp.message}
                      </div>
                    </div>
                  )}
                  {selectedApp.resumeLink && (
                    <a href={selectedApp.resumeLink} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-blue-600 font-medium hover:underline cursor-pointer">
                      📄 View Submitted ({getDisplayFilename(selectedApp.resumeLink)})
                    </a>
                  )}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <a href={`/jobs/${selectedApp.job?._id}`} className="block w-full text-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-lg transition-colors cursor-pointer">
                      View Job Post
                    </a>
                  </div>
                </div>
              )}

              {modalMode === "edit" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Update your cover letter or resume for the <strong>{selectedApp.job?.title}</strong> position.</p>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Update Resume (Optional)</label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors">
                        <Upload size={14} />
                        {editResumeFile ? editResumeFile.name : "Choose new resume"}
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
                              if (!allowed.includes(file.type)) {
                                toast.error("Only PDF and Word documents are allowed");
                                e.target.value = "";
                                return;
                              }
                              setEditResumeFile(file);
                            }
                          }} 
                        />
                      </label>
                      {editResumeFile && (
                        <button onClick={() => setEditResumeFile(null)} className="text-xs text-red-500 hover:underline">Clear</button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Update Cover Letter</label>
                    <textarea
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      placeholder="Add a cover letter or message to the recruiter..."
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-[100px] focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-2">
                    <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors cursor-pointer">Cancel</button>
                    <button onClick={handleEdit} disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                      {actionLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}

              {modalMode === "delete" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to withdraw your application for <strong>{selectedApp.job?.title}</strong> at <strong>{selectedApp.recruiter?.companyName || selectedApp.recruiter?.name}</strong>?
                  </p>
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
                    This action cannot be undone. You will be removed from the recruiter's applicant list.
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors cursor-pointer">Cancel</button>
                    <button onClick={handleDelete} disabled={actionLoading} className="px-4 py-2 bg-red-600 text-white font-medium text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                      {actionLoading ? "Withdrawing..." : "Withdraw Application"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-slideUp max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Edit Profile</h2>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Role / Title</label>
                  <input type="text" value={profileData.title} onChange={e => setProfileData({...profileData, title: e.target.value})} placeholder="e.g. Frontend Developer" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select 
                  value={profileData.location} 
                  onChange={e => setProfileData({...profileData, location: e.target.value})} 
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a city</option>
                  {PAKISTAN_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                <div className="w-full border border-gray-200 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500 bg-white min-h-[46px] flex flex-wrap gap-2 items-center">
                  {profileData.skills.map((skill, i) => (
                    <span key={i} className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-blue-800 transition-colors cursor-pointer rounded-full p-0.5 hover:bg-blue-100">
                        <X size={12}/>
                      </button>
                    </span>
                  ))}
                  <input 
                    type="text" 
                    value={skillInput} 
                    onChange={e => setSkillInput(e.target.value)} 
                    onKeyDown={handleSkillAdd}
                    placeholder={profileData.skills.length === 0 ? "Type a skill and press Enter..." : ""} 
                    className="flex-1 min-w-[120px] text-sm outline-none bg-transparent" 
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add a skill</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About Me (Bio)</label>
                <textarea value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} placeholder="Write a short summary about yourself..." className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Cover Letter</label>
                <textarea value={profileData.coverLetter} onChange={e => setProfileData({...profileData, coverLetter: e.target.value})} placeholder="Write a default cover letter template..." className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-none" />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsEditProfileOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleProfileSave} disabled={actionLoading} className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                {actionLoading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Cover Letter Modal */}
      {isViewCoverLetterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-slideUp">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileTextIcon size={20} className="text-blue-500" /> Default Cover Letter
              </h2>
              <button onClick={() => setIsViewCoverLetterOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-serif bg-gray-50/50 p-6 rounded-lg border border-gray-100 shadow-inner">
                {user?.coverLetter}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
              <button onClick={() => setIsViewCoverLetterOpen(false)} className="px-5 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
