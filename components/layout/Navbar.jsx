"use client";

import {
  Bell,
  Briefcase,
  ChevronDown,
  GraduationCap,
  LoaderCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const menu = [
  { name: "Home", path: "/" },
  { name: "All Jobs", path: "/all-jobs" },
  { name: "About", path: "/about" },
  { name: "Terms", path: "/terms" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isLoggedIn = !!session?.user;
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('[aria-label="Toggle menu"]')
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const dashboardPath =
    session?.user?.role === "TalentFinder"
      ? "/recruiter/manage-jobs"
      : "/student/profile";

  return (
    <header className="border-b border-gray-200 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 md:px-10">
        <nav className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-105">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 bg-blue-500/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                CampusConnect
              </span>
              <span className="text-[10px] text-gray-500 font-medium -mt-1">
                Your Career Gateway
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="flex items-center gap-6">
            <ul className="hidden lg:flex items-center gap-6">
              {menu.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path))
                        ? "text-blue-600 bg-blue-100 shadow-sm"
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop Auth Buttons */}
            {isLoading ? (
              <LoaderCircle className="animate-spin text-blue-600 hidden lg:block" />
            ) : isLoggedIn ? (
              <div className="hidden lg:flex items-center gap-4 relative" ref={profileMenuRef}>
                <Link
                  href={dashboardPath}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 focus:outline-none bg-white px-3 py-2 rounded-full shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                >
                  <span className="text-sm font-medium text-gray-700">
                    Hi, {session.user.name || "User"}
                  </span>
                  <img
                    className="w-8 h-8 rounded-full object-cover border-2 border-blue-100"
                    src={(!session.user.image || session.user.image === "/profile_img.png") ? "/premium-avatar.png" : session.user.image}
                    alt="Profile"
                  />
                  <ChevronDown
                    size={16}
                    className={`transition-transform text-blue-500 ${
                      isProfileMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-12 mt-2 w-56 origin-top-right rounded-lg border border-gray-200 bg-white z-50 overflow-hidden shadow-xl animate-fadeIn">
                    <Link
                      href={dashboardPath}
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 gap-2 transition-colors"
                    >
                      <Briefcase size={16} />
                      {session.user.role === "TalentFinder" ? "Recruiter Dashboard" : "My Profile"}
                    </Link>
                    <button
                      className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 gap-2 transition-colors cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-4">
                <Link
                  href="/login"
                  className="bg-white text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-all shadow-sm border border-blue-100 hover:shadow"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              aria-label="Toggle menu"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        ref={mobileMenuRef}
      >
        <div className="fixed inset-0 backdrop-blur-sm bg-blue-900/20" onClick={() => setIsMobileMenuOpen(false)} />
        <div className="relative flex flex-col w-4/5 max-w-sm h-full bg-white border-r shadow-xl">
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              CampusConnect
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full text-blue-600 hover:bg-white/80">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menu.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`block px-4 py-3 rounded-md text-sm font-medium ${
                      pathname === item.path
                        ? "bg-blue-100 text-blue-600 shadow-sm"
                        : "text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            {isLoggedIn ? (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    className="w-10 h-10 rounded-full object-cover"
                    src={(!session.user.image || session.user.image === "/profile_img.png") ? "/premium-avatar.png" : session.user.image}
                    alt="Profile"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                    <p className="text-xs text-gray-500">{session.user.email}</p>
                  </div>
                </div>
                <Link
                  href={dashboardPath}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 mb-1"
                >
                  <Briefcase size={16} className="inline mr-2" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <LogOut size={16} className="inline mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <Link href="/login" className="block w-full bg-blue-50 text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-100 text-center">
                  Login
                </Link>
                <Link href="/signup" className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 text-center">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
