"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, FileText, PieChart, MessageSquare, Star, ArrowRight } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      delay: i * 0.15,
    },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function AboutPage() {
  return (
    <div className="bg-slate-50/30 min-h-screen">
      {/* ════════════════════════════════════════════════════════════
          MAIN CONTAINER
      ════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-10 py-16 sm:py-24">
        
        {/* ── Top Hero / Grid Section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24 sm:mb-32">
          {/* Left Column: Image Card */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
            <img
              src="https://images.pexels.com/photos/3184311/pexels-photo-3184311.jpeg"
              alt="Woman working in a collaborative space"
              className="w-full h-[320px] sm:h-[450px] object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          </motion.div>

          {/* Right Column: Hero Content */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="flex flex-col items-start"
          >
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6 bg-blue-50 border border-blue-100">
              <Sparkles size={14} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">
                Find Your Match
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 leading-[1.1] mb-6 tracking-tight">
              Millions of Jobs.
              <br />
              Find the one that{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                suits you.
              </span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Search all the open positions on the web. Get your own personalized
              salary estimate. Read reviews on over 600,000 companies worldwide.
            </p>

            {/* Checkmark List */}
            <ul className="space-y-4 mb-10 w-full">
              {[
                "Bring to the table win-win survival",
                "Capitalize on low hanging fruit to identify",
                "But I must explain to you how all this",
              ].map((item, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.15 }}
                  className="flex items-center gap-3 text-slate-600 font-medium"
                >
                  <span className="p-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>

            {/* CTA Button */}
            <Link href="/signup">
              <span className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white text-base transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:brightness-110 active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-600">
                Get Started
                <ArrowRight size={18} />
              </span>
            </Link>
          </motion.div>
        </div>

        {/* ── Stats Counter Section ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 px-8 rounded-3xl border border-slate-100 bg-white/60 backdrop-blur-md shadow-sm mb-28 text-center"
        >
          {[
            { value: "414K", label: "Daily active users" },
            { value: "138+", label: "Open job positions" },
            { value: "3,498+", label: "Stories shared" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="flex flex-col items-center justify-center p-4"
            >
              <span className="text-4xl text-blue-600 mb-2">
                {stat.value}
              </span>
              <span className="text-slate-600 text-base">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* ── About Campus Connect Main Section ── */}
        <div className="mb-28 max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-slate-800 text-center mb-8 tracking-tight"
          >
            About Campus Connect
          </motion.h2>
          <div className="text-center space-y-6 text-slate-500 text-lg leading-relaxed">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              For much that one rank beheld bluebird after outside ignobly allegedly
              more when oh arrogantly vehement irresistibly fussy penguin insect
              additionally wow absolutely crud meretriciously hastily dalmatian a
              glowered inset one echidna cassowary some parrot and much as goodness
              some froze the sullen much connected bat.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="font-medium text-slate-600/90"
            >
              Repeatedly dreamed alas opossum but dramatically despite expeditiously
              that jeepers loosely yikes that as or eel underneath kept and slept
              compactly far purred sure abidingly up above fitting to strident wiped
              set waywardly.
            </motion.p>
          </div>
        </div>

        {/* ── Testimonials Section ── */}
        <div className="mb-28">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 tracking-tight"
            >
              Testimonials From Our Customers
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="text-lg text-slate-400 font-medium"
            >
              Hear from those who found success with our platform
            </motion.p>
          </div>

          {/* Testimonial Cards Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10"
          >
            {[
              {
                title: "Highly Recommended",
                quote: "I landed my dream job within just a week! The interface is clean, intuitive, and the support team was incredibly helpful throughout the process.",
                name: "Daniel Thompson",
                role: "Digital Marketing Manager",
                avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
              },
              {
                title: "Seamless and Efficient",
                quote: "Creating a profile and applying for jobs took only minutes. The job listings are relevant, well-organized, and updated regularly – a great experience overall.",
                name: "Sara Ahmed",
                role: "UI/UX Designer",
                initials: "SA",
                avatarColor: "bg-blue-600 text-white",
              },
              {
                title: "A Game-Changer for Job Seekers",
                quote: "I've tried several job portals, but this one truly stands out. It's simple, fast, and effective – I found a fantastic opportunity here!",
                name: "Kevin Brooks",
                role: "Software Engineer",
                avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150",
              },
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}
                className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm flex flex-col justify-between transition-all duration-300"
              >
                <div>
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    {testimonial.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed mb-6 italic">
                    "{testimonial.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-4 border-t border-slate-100 pt-5">
                  {testimonial.avatar ? (
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${testimonial.avatarColor}`}>
                      {testimonial.initials}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                      {testimonial.name}
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">
                      {testimonial.role}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Slider Pagination Dots */}
          <div className="flex justify-center gap-2">
            <span className="w-5 h-2 rounded-full bg-blue-500 transition-all duration-300" />
            <span className="w-2 h-2 rounded-full bg-slate-200 hover:bg-slate-300 cursor-pointer" />
            <span className="w-2 h-2 rounded-full bg-slate-200 hover:bg-slate-300 cursor-pointer" />
            <span className="w-2 h-2 rounded-full bg-slate-200 hover:bg-slate-300 cursor-pointer" />
          </div>
        </div>

        {/* ── How It Works Section ── */}
        <div>
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 tracking-tight"
            >
              How It Works?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="text-lg text-slate-400 font-medium"
            >
              Job for anyone, anywhere
            </motion.p>
          </div>

          {/* Cards Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                title: "Free Resume Assessments",
                desc: "Employers on average spend 31 seconds scanning resumes to identify potential matches.",
                icon: FileText,
                iconColor: "text-amber-500",
                iconBg: "bg-amber-50 border-amber-100",
              },
              {
                title: "Job Fit Scoring",
                desc: "Our advanced algorithm scores your resume against job criteria.",
                icon: PieChart,
                iconColor: "text-emerald-500",
                iconBg: "bg-emerald-50 border-emerald-100",
              },
              {
                title: "Help Every Step of the Way",
                desc: "Receive expert guidance throughout your job search journey.",
                icon: MessageSquare,
                iconColor: "text-indigo-500",
                iconBg: "bg-indigo-50 border-indigo-100",
              },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}
                  className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center transition-all duration-300"
                >
                  <div className={`p-4 rounded-2xl border ${step.iconBg} mb-6 shrink-0`}>
                    <Icon size={28} className={step.iconColor} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
