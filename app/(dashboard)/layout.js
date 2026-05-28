"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { toast } from "react-hot-toast";
import {
  GraduationCap, Bell, LogOut, LoaderCircle, Briefcase, PlusCircle,
  Users, CheckCircle, User, FileText, Sparkles, Star, LayoutDashboard, Menu, X,
  Calendar,
} from "lucide-react";
import { useState, useEffect } from "react";

const studentLinks = [
  { name: "My Profile", path: "/student/profile", icon: User },
  { name: "Applications", path: "/student/applications", icon: Briefcase },
  { name: "Recommendations", path: "/student/recommendations", icon: Star },
  { name: "Resume Analyzer", path: "/student/resume-analyzer", icon: Sparkles },
];

const recruiterLinks = [
  { name: "Manage Jobs", path: "/recruiter/manage-jobs", icon: LayoutDashboard },
  { name: "Add Job", path: "/recruiter/add-job", icon: PlusCircle },
  { name: "Apply Applicants", path: "/recruiter/applicants", icon: Users },
  { name: "ShortListed Applications", path: "/recruiter/shortlisted", icon: CheckCircle },
  { name: "Availability", path: "/recruiter/availability", icon: Calendar },
];

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const isRecruiter = session?.user?.role === "TalentFinder";
  const links = isRecruiter ? recruiterLinks : studentLinks;

  useEffect(() => {
    setSidebarOpen(false);
    setShowNotif(false);
  }, [pathname]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (data.success) setNotifications(data.notifications);
      } catch {}
    };
    if (session?.user) fetchNotifications();
  }, [session]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch {}
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
    toast.success("Logged out successfully");
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="animate-spin text-blue-600 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="flex items-center justify-between border-b border-gray-200 py-3 bg-white sticky top-0 z-30 px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-800 hidden sm:block">CampusConnect</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative p-2 rounded-full bg-white border border-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 shadow-sm transition-all cursor-pointer"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-[1px] rounded-full min-w-[16px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 animate-fadeIn">
                <div className="p-3 border-b flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline cursor-pointer">
                      Mark all read
                    </button>
                  )}
                </div>
                <ul className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 10).map((n) => (
                      <li key={n._id} className={`p-3 text-sm border-b last:border-b-0 ${!n.read ? "bg-blue-50/50" : ""}`}>
                        <p className="font-medium text-gray-800">{n.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{n.message}</p>
                      </li>
                    ))
                  ) : (
                    <li className="p-4 text-sm text-gray-500 text-center">No notifications</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* User info */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {session?.user?.name}
            </span>
            <img
              className="w-8 h-8 rounded-full object-cover border-2 border-blue-100"
              src={(!session?.user?.image || session?.user?.image === "/profile_img.png") ? "/premium-avatar.png" : session?.user?.image}
              alt="Profile"
            />
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-500 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:sticky top-[57px] left-0 h-[calc(100vh-57px)] md:w-64 w-64 border-r border-gray-200 bg-white z-20 transition-transform duration-200 flex flex-col`}>
          <nav className="pt-4 flex-1">
            {links.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  href={item.path}
                  key={item.path}
                  className={`flex items-center py-3 px-5 gap-3 transition-all text-sm ${
                    isActive
                      ? "border-r-4 border-blue-500 bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
