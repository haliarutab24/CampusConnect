"use client";

import Link from "next/link";
import { MapPin, Clock, Briefcase, IndianRupee } from "lucide-react";
import moment from "moment";

export default function JobCard({ job }) {
  const company = job.postedBy || {};

  return (
    <div className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-300 animate-fadeIn">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 flex-shrink-0 bg-gradient-to-br from-blue-50 to-indigo-50 border border-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
          <img
            src={company.image || "/company.webp"}
            alt={company.companyName || company.name || "Company"}
            className="w-10 h-10 object-cover rounded-lg"
          />
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/jobs/${job._id}`}>
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate cursor-pointer">
              {job.title}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 mb-3">
            {company.companyName || company.name || "Company"}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-blue-500" />
              {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase size={14} className="text-green-500" />
              {job.level}
            </span>
            <span className="flex items-center gap-1">
              <IndianRupee size={14} className="text-amber-500" />
              {job.salary ? `${(job.salary / 1000).toFixed(0)}K` : "Not disclosed"}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} className="text-gray-400" />
              {moment(job.createdAt).fromNow()}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full">
            {job.category}
          </span>
          {job.matchScore > 0 && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              job.matchScore >= 70
                ? "bg-green-50 text-green-600"
                : job.matchScore >= 40
                ? "bg-amber-50 text-amber-600"
                : "bg-gray-50 text-gray-500"
            }`}>
              {job.matchScore}% match
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
