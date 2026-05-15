"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import JobCard from "@/components/jobs/JobCard";

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await fetch("/api/jobs/recommendations");
        const data = await res.json();
        if (data.success) setRecommendations(data.recommendations);
      } catch {} finally { setLoading(false); }
    };
    fetchRecs();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><LoaderCircle className="animate-spin text-blue-500 w-8 h-8" /></div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="text-blue-500" size={24} />
          AI Job Recommendations
        </h1>
        <p className="text-gray-500 mt-1">Jobs matched to your skills, sorted by relevance.</p>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No recommendations yet</h3>
          <p className="text-gray-500">Add skills to your profile to get AI-powered job matches.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((job) => (
            <div key={job._id} className="relative">
              <JobCard job={job} />
              {job.matchedSkills?.length > 0 && (
                <div className="mt-1 px-5 pb-2 flex flex-wrap gap-1">
                  {job.matchedSkills.map((s, i) => (
                    <span key={i} className="bg-green-50 text-green-600 text-[10px] px-2 py-0.5 rounded-full">✓ {s}</span>
                  ))}
                  {job.missingKeywords?.slice(0, 3).map((s, i) => (
                    <span key={i} className="bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 rounded-full">+ {s}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
