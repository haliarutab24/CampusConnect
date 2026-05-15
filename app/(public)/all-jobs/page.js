"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react";
import JobCard from "@/components/jobs/JobCard";

const JobCategories = [
  "Software Development", "Marketing", "Design", "Data Science",
  "Management", "Cybersecurity", "Networking", "AI & Machine Learning",
];

const JobLocations = [
  "Islamabad", "Lahore", "Karachi", "Rawalpindi",
  "Faisalabad", "Peshawar", "Remote",
];

function AllJobsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get("category") || "";
  const searchParam = searchParams.get("search") || "";

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [searchInput, setSearchInput] = useState({
    title: searchParam,
    location: "",
    selectedCategories: categoryParam ? [categoryParam] : [],
    selectedLocations: [],
  });

  const jobsPerPage = 6;

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/jobs");
        const data = await res.json();
        if (data.success) setJobs(data.jobs);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    let results = [...jobs];

    if (searchInput.title.trim()) {
      results = results.filter((job) =>
        job.title.toLowerCase().includes(searchInput.title.trim().toLowerCase())
      );
    }

    if (searchInput.location.trim()) {
      results = results.filter((job) =>
        job.location.toLowerCase().includes(searchInput.location.trim().toLowerCase())
      );
    }

    if (searchInput.selectedCategories.length > 0) {
      results = results.filter((job) =>
        searchInput.selectedCategories.includes(job.category)
      );
    }

    if (searchInput.selectedLocations.length > 0) {
      results = results.filter((job) =>
        searchInput.selectedLocations.includes(job.location)
      );
    }

    return results;
  }, [jobs, searchInput]);

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const paginatedJobs = useMemo(() => {
    return filteredJobs.slice(
      (currentPage - 1) * jobsPerPage,
      currentPage * jobsPerPage
    );
  }, [filteredJobs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput]);

  const handleCategoryToggle = (cat) => {
    setSearchInput((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(cat)
        ? prev.selectedCategories.filter((c) => c !== cat)
        : [...prev.selectedCategories, cat],
    }));
  };

  const handleLocationToggle = (loc) => {
    setSearchInput((prev) => ({
      ...prev,
      selectedLocations: prev.selectedLocations.includes(loc)
        ? prev.selectedLocations.filter((l) => l !== loc)
        : [...prev.selectedLocations, loc],
    }));
  };

  const clearAllFilters = () => {
    setSearchInput({
      title: "",
      location: "",
      selectedCategories: [],
      selectedLocations: [],
    });
    router.push("/all-jobs");
  };

  const activeFilterCount =
    searchInput.selectedCategories.length +
    searchInput.selectedLocations.length +
    (searchInput.title ? 1 : 0) +
    (searchInput.location ? 1 : 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-10 py-12">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-10 py-8">
      {/* Mobile Filter Toggle */}
      <div className="md:hidden flex justify-end mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition shadow-sm"
        >
          <Filter size={18} />
          {showFilters ? "Hide Filters" : "Show Filters"}
          {activeFilterCount > 0 && (
            <span className="bg-white text-blue-600 text-xs font-bold px-1.5 rounded-full">{activeFilterCount}</span>
          )}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className={`md:w-72 lg:w-80 flex-shrink-0 ${showFilters ? "block" : "hidden md:block"}`}>
          <div className="sticky top-24 bg-white border border-gray-200 rounded-xl p-5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="text-xs text-red-500 hover:underline cursor-pointer">
                  Clear All
                </button>
              )}
            </div>

            {/* Title Search */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Job Title</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchInput.title}
                  onChange={(e) => setSearchInput((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Search title..."
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Location Search */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Location</label>
              <input
                type="text"
                value={searchInput.location}
                onChange={(e) => setSearchInput((p) => ({ ...p, location: e.target.value }))}
                placeholder="Enter location..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {JobCategories.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800 py-0.5">
                    <input
                      type="checkbox"
                      checked={searchInput.selectedCategories.includes(cat)}
                      onChange={() => handleCategoryToggle(cat)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Locations</h3>
              <div className="space-y-1.5">
                {JobLocations.map((loc) => (
                  <label key={loc} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800 py-0.5">
                    <input
                      type="checkbox"
                      checked={searchInput.selectedLocations.includes(loc)}
                      onChange={() => handleLocationToggle(loc)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {loc}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Job Cards */}
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              {searchInput.selectedCategories.length === 1
                ? `Jobs in ${searchInput.selectedCategories[0]}`
                : "All Jobs"}
              {filteredJobs.length > 0 && (
                <span className="text-gray-400 text-lg font-normal ml-2">
                  ({filteredJobs.length})
                </span>
              )}
            </h1>
            <p className="text-gray-500">Find your next opportunity from top companies</p>
          </div>

          {/* Active Filters Tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {searchInput.selectedCategories.map((cat) => (
                <span key={cat} className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-full">
                  {cat}
                  <X size={12} className="cursor-pointer hover:text-blue-800" onClick={() => handleCategoryToggle(cat)} />
                </span>
              ))}
              {searchInput.selectedLocations.map((loc) => (
                <span key={loc} className="inline-flex items-center gap-1 bg-green-50 text-green-600 text-xs px-2.5 py-1 rounded-full">
                  {loc}
                  <X size={12} className="cursor-pointer hover:text-green-800" onClick={() => handleLocationToggle(loc)} />
                </span>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {paginatedJobs.length > 0 ? (
              paginatedJobs.map((job) => <JobCard key={job._id} job={job} />)
            ) : (
              <div className="text-center bg-white p-12 border border-gray-200 rounded-xl">
                <Search size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No jobs found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search filters.</p>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg border text-sm font-medium cursor-pointer ${
                    currentPage === i + 1
                      ? "bg-blue-500 text-white border-blue-500"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AllJobsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
      <AllJobsContent />
    </Suspense>
  );
}
