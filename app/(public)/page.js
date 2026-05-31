"use client";

import Link from "next/link";
import {
  Search,
  MapPin,
  ArrowRight,
  Briefcase,
  Users,
  Building2,
  TrendingUp,
  Star,
  ChevronRight,
  GraduationCap,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ── Data ──────────────────────────────────────────────────────────────────────

const HERO_SLIDES = [
  {
    url: "https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg",
    label: "Campus Architecture",
  },
  {
    url: "https://images.pexels.com/photos/159490/yale-university-landscape-universities-schools-159490.jpeg",
    label: "Student Library Grounds",
  },
  {
    url: "https://images.pexels.com/photos/1205651/pexels-photo-1205651.jpeg",
    label: "Collaborative Tech Workspace",
  },
];

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
  { label: "Active Jobs", value: "500+", icon: Briefcase, color: "from-blue-500 to-blue-600" },
  { label: "Companies", value: "150+", icon: Building2, color: "from-indigo-500 to-indigo-600" },
  { label: "Students Hired", value: "2000+", icon: Users, color: "from-violet-500 to-violet-600" },
  { label: "Success Rate", value: "89%", icon: TrendingUp, color: "from-sky-500 to-sky-600" },
];

const testimonials = [
  {
    name: "Sarah Ahmed",
    role: "Software Developer",
    company: "TechCorp",
    text: "CampusConnect helped me land my dream internship. The AI matching was spot on!",
    initials: "SA",
    avatarColor: "from-pink-500 to-rose-500",
    rating: 5,
  },
  {
    name: "Muhammad Ali",
    role: "Data Analyst",
    company: "DataFlow",
    text: "The resume analyzer gave me actionable feedback that improved my ATS score by 40%.",
    initials: "MA",
    avatarColor: "from-blue-500 to-indigo-500",
    rating: 5,
  },
  {
    name: "Fatima Khan",
    role: "UI/UX Designer",
    company: "DesignHub",
    text: "I found 3 interview calls within the first week of signing up. Incredible platform!",
    initials: "FK",
    avatarColor: "from-emerald-500 to-teal-500",
    rating: 4,
  },
];

// ── Animations ────────────────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [searchTitle, setSearchTitle] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTitle) params.set("search", searchTitle);
    if (searchLocation) params.set("location", searchLocation);
    router.push(`/all-jobs?${params.toString()}`);
  };

  const goToSlide = useCallback(
    (idx) => {
      setDirection(idx > currentSlide ? 1 : -1);
      setCurrentSlide(idx);
    },
    [currentSlide]
  );

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <>
      {/* ════════════════════════════════════════════════════════════
          HERO SECTION — Full-Bleed Slider
      ════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: "92vh" }}>

        {/* ── Image Slider ── */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img
                src={HERO_SLIDES[currentSlide].url}
                alt={HERO_SLIDES[currentSlide].label}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Slider Controls ── */}
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-[calc(8vh+16px)] left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="cursor-pointer transition-all duration-300"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? "w-6 h-2 bg-white"
                    : "w-2 h-2 bg-white/50 hover:bg-white/75"
                }`}
              />
            </button>
          ))}
        </div>

        {/* ── Hero Content ── */}
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-8 md:px-10 flex flex-col items-center justify-center text-center"
          style={{ minHeight: "84vh", paddingBottom: "10vh" }}
        >
          {/* Badge */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6"
            style={{
              background: "rgba(255, 255, 255, 0.45)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.6)",
            }}
          >
            <Sparkles size={15} className="text-indigo-600 animate-pulse" />
            <span className="text-sm font-semibold text-slate-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
              AI-Powered Job Matching &amp; Resume Analysis
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-5 leading-[1.08] tracking-tight max-w-4xl"
            style={{
              filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.85)) drop-shadow(0 2px 4px rgba(0,0,0,0.7))",
            }}
          >
            Find Your Dream
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #60a5fa, #a78bfa, #818cf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Campus Job
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-lg sm:text-xl text-white font-medium mb-10 max-w-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
          >
            Connect with top companies, get AI-powered job recommendations, and
            analyze your resume — all in one platform built for university students.
          </motion.p>

           {/* ── Glassmorphic Search Console ── */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="w-full max-w-3xl"
          >
            <form
              onSubmit={handleSearch}
              className="rounded-2xl p-2 sm:p-3"
              style={{
                background: "rgba(255, 255, 255, 0.45)",
                backdropFilter: "blur(30px)",
                WebkitBackdropFilter: "blur(30px)",
                border: "1px solid rgba(255, 255, 255, 0.60)",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.40)",
              }}
            >
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Job title input */}
                <div className="flex-1 flex items-center gap-3 rounded-xl px-4 py-3 bg-white/50 border border-slate-200/50 focus-within:border-blue-500 hover:bg-white/70 transition-all duration-200 group shadow-sm">
                  <Search size={18} className="text-slate-500 flex-shrink-0 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Job title or keyword..."
                    className="w-full outline-none bg-transparent text-slate-800 placeholder-slate-400 text-sm font-medium"
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                  />
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px bg-slate-200/60 my-1" />

                {/* Location input */}
                <div className="flex-1 flex items-center gap-3 rounded-xl px-4 py-3 bg-white/50 border border-slate-200/50 focus-within:border-blue-500 hover:bg-white/70 transition-all duration-200 group shadow-sm">
                  <MapPin size={18} className="text-slate-500 flex-shrink-0 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Location..."
                    className="w-full outline-none bg-transparent text-slate-800 placeholder-slate-400 text-sm font-medium"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>

                {/* Search button */}
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 cursor-pointer hover:brightness-110 active:scale-95 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)",
                    boxShadow: "0 4px 20px rgba(59,130,246,0.45)",
                  }}
                >
                  <Search size={16} />
                  Search Jobs
                </button>
              </div>
            </form>

            {/* Quick category links */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["Software Development", "Design", "Data Science", "AI & Machine Learning"].map(
                (cat) => (
                  <Link
                    key={cat}
                    href={`/all-jobs?category=${encodeURIComponent(cat)}`}
                    className="text-xs text-slate-700 hover:text-slate-900 hover:bg-white/95 font-medium transition-all duration-200 px-3 py-1.5 rounded-full border border-slate-200/50 hover:border-slate-300 bg-white/60 backdrop-blur-md shadow-sm"
                  >
                    {cat}
                  </Link>
                )
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          STATS SECTION
      ════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-5"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                custom={i}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative rounded-2xl p-6 overflow-hidden cursor-default"
                style={{
                  background: "rgba(255,255,255,0.70)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(229,231,235,1)",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                }}
              >
                {/* Icon circle */}
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-md`}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1 font-medium">{stat.label}</p>
                {/* Decorative corner glow */}
                <div
                  className={`absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${stat.color} opacity-10 blur-2xl`}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          CATEGORIES SECTION
      ════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-10">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-blue-600 uppercase mb-3">
              <Sparkles size={12} /> Browse by Field
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Explore Job Categories
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Browse opportunities across various fields and find the perfect role that
              matches your skills.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {jobCategories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <Link
                  href={`/all-jobs?category=${encodeURIComponent(cat.name)}`}
                  className="group block p-6 bg-white rounded-2xl border border-gray-100 transition-all duration-300"
                  style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 8px 30px rgba(99,102,241,0.15), 0 0 0 1px rgba(99,102,241,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)";
                  }}
                >
                  <span className="text-3xl mb-4 block">{cat.icon}</span>
                  <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors mb-2 text-sm leading-snug">
                    {cat.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">{cat.count} jobs</span>
                    <ChevronRight
                      size={15}
                      className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"
                    />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-10">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-amber-500 uppercase mb-3">
              <Star size={12} className="fill-amber-400" /> Student Stories
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              What Students Say
            </h2>
            <p className="text-gray-500">
              Hear from students who found their dream jobs through CampusConnect.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-2xl p-7 flex flex-col gap-5 cursor-default overflow-hidden"
                style={{
                  background: "rgba(255,255,255,1)",
                  border: "1px solid rgba(229,231,235,1)",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                  transition: "box-shadow 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.10)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.05)";
                }}
              >
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      size={15}
                      className={
                        j < t.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"
                      }
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-700 leading-relaxed text-sm flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>

                {/* Divider */}
                <div className="w-full h-px bg-gray-100" />

                {/* Profile */}
                <div className="flex items-center gap-4">
                  {/* Gradient avatar with initials */}
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.avatarColor} flex items-center justify-center flex-shrink-0 shadow-md`}
                  >
                    <span className="text-white text-sm font-bold">{t.initials}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{t.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.role} · {t.company}
                    </p>
                  </div>
                  {/* Verified badge */}
                  <div className="ml-auto flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-semibold px-2 py-1 rounded-full border border-emerald-100">
                    ✓ Verified
                  </div>
                </div>

                {/* Decorative large quote mark */}
                <span
                  className="absolute top-4 right-5 text-7xl font-serif leading-none text-gray-100 select-none pointer-events-none"
                  aria-hidden="true"
                >
                  "
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          CTA SECTION
      ════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #4338ca 50%, #312e81 100%)",
          }}
        />
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-400 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-violet-400 rounded-full opacity-20 blur-3xl" />

        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-7">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
              Ready to Launch
              <br />
              <span className="text-blue-200">Your Career?</span>
            </h2>
            <p className="text-blue-200 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students who have already found their dream campus jobs.
              Sign up today and let AI match you with the perfect opportunity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 duration-200"
              >
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link
                href="/all-jobs"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/25 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-all duration-200"
              >
                Browse Jobs
              </Link>
            </div>

            {/* Trust strip */}
            <div className="flex items-center justify-center gap-6 mt-10 text-blue-300 text-xs font-medium flex-wrap">
              <span>✓ Free for students</span>
              <span className="hidden sm:block w-px h-3 bg-blue-600" />
              <span>✓ No credit card required</span>
              <span className="hidden sm:block w-px h-3 bg-blue-600" />
              <span>✓ AI-powered matching</span>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
