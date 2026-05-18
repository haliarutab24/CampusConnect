"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { GraduationCap, Building2, Eye, EyeOff, LoaderCircle, Upload, X } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("TalentSeeker");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    image: null,
    // Student fields
    skills: "",
    bio: "",
    // Recruiter fields
    companyName: "",
    description: "",
    website: "",
    location: "",
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((p) => ({ ...p, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      return toast.error("Please fill in all required fields");
    }
    
    // Password standard validation
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password) || !/[@$!%*?&]/.test(form.password)) {
      return toast.error("Please ensure your password meets all security requirements");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("role", activeTab);
      
      if (form.image) {
        formData.append("image", form.image);
      }

      if (activeTab === "TalentSeeker") {
        formData.append("skills", form.skills);
        formData.append("bio", form.bio);
      } else {
        formData.append("companyName", form.companyName || form.name);
        formData.append("description", form.description);
        formData.append("website", form.website);
        formData.append("location", form.location);
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Registration successful! Signing in...");
        // Auto sign-in
        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });
        if (!result?.error) {
          router.push(activeTab === "TalentFinder" ? "/recruiter/manage-jobs" : "/student/profile");
          router.refresh();
        }
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-0 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
          <p className="text-gray-500 text-sm">Join CampusConnect today</p>
        </div>

        {/* Tabs */}
        <div className="flex mx-8 mt-6 bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setActiveTab("TalentSeeker")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === "TalentSeeker" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
            }`}
          >
            <GraduationCap size={16} /> Student
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("TalentFinder")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === "TalentFinder" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
            }`}
          >
            <Building2 size={16} /> Recruiter
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {/* Image Upload */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <div className={`w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                imagePreview ? "border-blue-300" : "border-gray-300 group-hover:border-blue-400"
              }`}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload size={24} className="text-gray-400 group-hover:text-blue-500" />
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              <p className="text-xs text-gray-500 text-center mt-1">Upload Photo (Optional)</p>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={activeTab === "TalentSeeker" ? "John Doe" : "Company Name"}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@university.edu"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Create a password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Password Requirements Checklist */}
            {form.password.length > 0 && (
              <div className="mt-2.5 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                <p className="text-xs font-semibold text-gray-700 mb-1.5">Password Requirements:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-2">
                  <p className={`text-xs flex items-center gap-1.5 ${form.password.length >= 8 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center ${form.password.length >= 8 ? 'bg-green-100' : 'bg-gray-200'}`}>
                      {form.password.length >= 8 && <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>}
                    </span>
                    At least 8 characters
                  </p>
                  <p className={`text-xs flex items-center gap-1.5 ${/[A-Z]/.test(form.password) ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center ${/[A-Z]/.test(form.password) ? 'bg-green-100' : 'bg-gray-200'}`}>
                      {/[A-Z]/.test(form.password) && <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>}
                    </span>
                    One uppercase letter
                  </p>
                  <p className={`text-xs flex items-center gap-1.5 ${/[a-z]/.test(form.password) ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center ${/[a-z]/.test(form.password) ? 'bg-green-100' : 'bg-gray-200'}`}>
                      {/[a-z]/.test(form.password) && <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>}
                    </span>
                    One lowercase letter
                  </p>
                  <p className={`text-xs flex items-center gap-1.5 ${/\d/.test(form.password) ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center ${/\d/.test(form.password) ? 'bg-green-100' : 'bg-gray-200'}`}>
                      {/\d/.test(form.password) && <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>}
                    </span>
                    One number
                  </p>
                  <p className={`text-xs flex items-center gap-1.5 col-span-1 sm:col-span-2 ${/[@$!%*?&]/.test(form.password) ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center ${/[@$!%*?&]/.test(form.password) ? 'bg-green-100' : 'bg-gray-200'}`}>
                      {/[@$!%*?&]/.test(form.password) && <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>}
                    </span>
                    One special character (@$!%*?&)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Role-specific fields */}
          {activeTab === "TalentSeeker" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))}
                  placeholder="React, Node.js, Python..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                  placeholder="Your Company"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="Islamabad, Pakistan"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <><LoaderCircle size={18} className="animate-spin" /> Creating Account...</> : "Create Account"}
          </button>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: activeTab === "TalentFinder" ? "/recruiter/manage-jobs" : "/student/profile" })}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <div className="px-8 pb-8 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
