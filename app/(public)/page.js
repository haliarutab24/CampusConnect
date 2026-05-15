"use client";

import Link from "next/link";
import { Search, MapPin, ArrowRight, Briefcase, Users, Building2, TrendingUp, Star, ChevronRight, GraduationCap, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const jobCategories = [
  { name: "Software Development", icon: "💻", count: "120+" },
  { name: "Marketing", icon: "📢", count: "85+" },
  { name: "Design", icon: "🎨", count: "65+" },
  { name: "Data Science", icon: "📊", count: "90+" },
  { name: "Management", icon: "📋", count: "50+" },
  { name: "Cybersecurity", icon: "🔒", count: "40+" },
  { name: "Networking", icon: "🌐", count: "35+" },
  { name: "AI & Machine Learning", icon: "🤖", count: "75+" },
];

const stats = [
  { label: "Active Jobs", value: "500+", icon: Briefcase },
  { label: "Companies", value: "150+", icon: Building2 },
  { label: "Students Hired", value: "2000+", icon: Users },
  { label: "Success Rate", value: "89%", icon: TrendingUp },
];

const testimonials = [
  {
    name: "Sarah Ahmed",
    role: "Software Developer",
    company: "TechCorp",
    text: "CampusConnect helped me land my dream internship. The AI matching was spot on!",
    avatar: "/default-avatar.png",
    rating: 5,
  },
  {
    name: "Muhammad Ali",
    role: "Data Analyst",
    company: "DataFlow",
    text: "The resume analyzer gave me actionable feedback that improved my ATS score by 40%.",
    avatar: "/default-avatar.png",
    rating: 5,
  },
  {
    name: "Fatima Khan",
    role: "UI/UX Designer",
    company: "DesignHub",
    text: "I found 3 interview calls within the first week of signing up. Incredible platform!",
    avatar: "/default-avatar.png",
    rating: 4,
  },
];

export default function HomePage() {
  const [searchTitle, setSearchTitle] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTitle) params.set("search", searchTitle);
    if (searchLocation) params.set("location", searchLocation);
    router.push(`/all-jobs?${params.toString()}`);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 lg:py-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: "2s" }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "4s" }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-10 relative z-10">
          <div
            className="text-center max-w-4xl mx-auto animate-slideUp"
          >
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-blue-100 rounded-full px-4 py-2 mb-6 shadow-sm">
              <Sparkles size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-blue-700">AI-Powered Job Matching & Resume Analysis</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Find Your Dream
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Campus Job</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Connect with top companies, get AI-powered job recommendations, and analyze your resume — all in one platform built for university students.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
              <div className="flex flex-col sm:flex-row bg-white rounded-2xl shadow-xl border border-gray-100 p-2 gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <Search size={20} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Job title or keyword..."
                    className="w-full outline-none text-gray-700 bg-transparent"
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                  />
                </div>
                <div className="hidden sm:block w-px bg-gray-200"></div>
                <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <MapPin size={20} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Location..."
                    className="w-full outline-none text-gray-700 bg-transparent"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-blue-500/25 cursor-pointer"
                >
                  Search Jobs
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                <stat.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Categories */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Explore Job Categories</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse opportunities across various fields and find the perfect role that matches your skills.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {jobCategories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/all-jobs?category=${encodeURIComponent(cat.name)}`}
                  className="group block p-6 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                >
                  <span className="text-3xl mb-3 block">{cat.icon}</span>
                  <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors mb-1">
                    {cat.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{cat.count} jobs</span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">What Students Say</h2>
            <p className="text-gray-600">Hear from students who found their dream jobs through CampusConnect.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={16} className={j < t.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role} at {t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <GraduationCap className="w-14 h-14 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Launch Your Career?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of students who have already found their dream campus jobs. Sign up today and let AI match you with the perfect opportunity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg inline-flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight size={18} />
              </Link>
              <Link
                href="/all-jobs"
                className="border-2 border-white/30 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all inline-flex items-center justify-center gap-2"
              >
                Browse Jobs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
