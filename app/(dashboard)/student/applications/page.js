"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LoaderCircle, Video, ExternalLink, Calendar, X, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  // Booking modal state
  const [bookingModal, setBookingModal] = useState(null); // { app, slots, loading, selectedSlot, booking, selectedDate }
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const fetchApps = async () => {
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (data.success) setApplications(data.applications);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  const statuses = ["All", "Pending", "Shortlisted", "Accepted", "Rejected", "Closed"];
  const filtered = filter === "All" ? applications : applications.filter((a) => a.status === filter);

  // Open booking modal and fetch available slots
  const openBookingModal = async (app) => {
    setBookingModal({ app, slots: [], loading: true, selectedSlot: null, selectedDate: null });

    try {
      const recruiterId = app.recruiter?._id || app.recruiter;
      const res = await fetch(`/api/availability/${recruiterId}`);
      const data = await res.json();

      if (data.success && data.slots.length > 0) {
        setBookingModal((prev) => ({
          ...prev,
          slots: data.slots,
          loading: false,
          selectedDate: data.slots[0]?.date || null,
        }));
      } else {
        setBookingModal((prev) => ({
          ...prev,
          slots: [],
          loading: false,
        }));
      }
    } catch {
      toast.error("Failed to load available slots");
      setBookingModal(null);
    }
  };

  // Book the selected slot
  const handleBookSlot = async () => {
    if (!bookingModal?.selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }

    setBookingInProgress(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: bookingModal.app._id,
          startTime: bookingModal.selectedSlot.startTime,
          endTime: bookingModal.selectedSlot.endTime,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setBookingModal(null);
        fetchApps(); // Refresh to show the new booking
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to book interview");
    } finally {
      setBookingInProgress(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoaderCircle className="animate-spin text-blue-500 w-8 h-8" /></div>;

  // Group slots by date for the booking modal
  const slotsByDate = {};
  if (bookingModal?.slots) {
    bookingModal.slots.forEach((slot) => {
      if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
      slotsByDate[slot.date].push(slot);
    });
  }
  const availableDates = Object.keys(slotsByDate).sort();

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Applications</h1>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              filter === s ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-gray-500">
          No {filter !== "All" ? filter.toLowerCase() : ""} applications found.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Job Title</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Match</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((app) => {
                  const isToday = app.interviewScheduledAt && moment(app.interviewScheduledAt).isSame(moment(), "day");

                  return (
                    <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <img src={app.recruiter?.image || "/company.webp"} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <span className="text-gray-800 font-medium">{app.recruiter?.companyName || app.recruiter?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-800">{app.job?.title}</td>
                      <td className="px-5 py-4 text-gray-600">{app.job?.location}</td>
                      <td className="px-5 py-4 text-gray-600">{app.job?.category}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium ${app.matchScore >= 60 ? "text-green-600" : "text-gray-500"}`}>
                          {app.matchScore || 0}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          app.status === "Shortlisted" || app.status === "Accepted" ? "bg-green-50 text-green-600"
                            : app.status === "Rejected" ? "bg-red-50 text-red-500"
                            : app.status === "Closed" ? "bg-gray-100 text-gray-500"
                            : "bg-blue-50 text-blue-600"
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{moment(app.createdAt).format("ll")}</td>

                      {/* Action Column */}
                      <td className="px-5 py-4 text-center">
                        {app.status === "Shortlisted" && app.interviewLink ? (
                          <div className="flex flex-col items-center gap-1">
                            <a
                              href={app.interviewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1.5 bg-emerald-500 text-white hover:bg-emerald-600 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${isToday ? "animate-pulse-glow-green" : ""}`}
                            >
                              <Video size={13} /> Join Screening Call
                              <ExternalLink size={11} />
                            </a>
                            {app.interviewScheduledAt && (
                              <span className={`text-[10px] flex items-center gap-0.5 ${isToday ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                                <Calendar size={9} />
                                {isToday ? "Today, " : ""}
                                {moment(app.interviewScheduledAt).format("h:mm A")}
                                {!isToday && ` · ${moment(app.interviewScheduledAt).format("MMM DD")}`}
                              </span>
                            )}
                          </div>
                        ) : app.status === "Shortlisted" ? (
                          <button
                            onClick={() => openBookingModal(app)}
                            className="inline-flex items-center gap-1.5 bg-blue-500 text-white hover:bg-blue-600 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer animate-pulse-glow"
                          >
                            <Calendar size={13} /> Book Interview
                          </button>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
            onClick={() => setBookingModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-slideUp max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Calendar className="text-blue-500" size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Book Screening Call</h3>
                  <p className="text-xs text-gray-400">
                    {bookingModal.app.job?.title} — {bookingModal.app.recruiter?.companyName || bookingModal.app.recruiter?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBookingModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Loading state */}
            {bookingModal.loading ? (
              <div className="flex items-center justify-center py-12">
                <LoaderCircle className="animate-spin text-blue-500 w-8 h-8" />
              </div>
            ) : bookingModal.slots.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500 font-medium">No available slots</p>
                <p className="text-xs text-gray-400 mt-1">
                  The recruiter hasn&apos;t set up their availability yet. Please check back later.
                </p>
              </div>
            ) : (
              <>
                {/* Date Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" /> Select a Date
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {availableDates.map((date) => {
                      const m = moment(date);
                      const isSelected = bookingModal.selectedDate === date;
                      const isDateToday = m.isSame(moment(), "day");

                      return (
                        <button
                          key={date}
                          onClick={() => setBookingModal((prev) => ({ ...prev, selectedDate: date, selectedSlot: null }))}
                          className={`flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 min-w-[64px] ${
                            isSelected
                              ? "bg-blue-500 text-white shadow-md"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-wider opacity-70">{m.format("ddd")}</span>
                          <span className="text-lg font-bold">{m.format("D")}</span>
                          <span className="text-[10px] opacity-70">{m.format("MMM")}</span>
                          {isDateToday && (
                            <span className={`text-[9px] mt-0.5 ${isSelected ? "text-blue-100" : "text-blue-500"}`}>
                              Today
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                {bookingModal.selectedDate && slotsByDate[bookingModal.selectedDate] && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <Clock size={14} className="text-gray-400" /> Pick a Time
                    </label>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {slotsByDate[bookingModal.selectedDate].map((slot) => {
                        const isSelected = bookingModal.selectedSlot?.startTime === slot.startTime;
                        return (
                          <button
                            key={slot.startTime}
                            onClick={() => setBookingModal((prev) => ({ ...prev, selectedSlot: slot }))}
                            className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-500 text-white shadow-md ring-2 ring-blue-300"
                                : "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200"
                            }`}
                          >
                            {moment(slot.startTime).format("h:mm A")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Confirmation */}
                {bookingModal.selectedSlot && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    <p className="text-xs text-emerald-700">
                      ✅ You selected <span className="font-bold">
                        {moment(bookingModal.selectedSlot.startTime).format("ddd, MMM D")} at {moment(bookingModal.selectedSlot.startTime).format("h:mm A")}
                      </span> — <span className="font-bold">
                        {moment(bookingModal.selectedSlot.endTime).format("h:mm A")}
                      </span>
                    </p>
                  </div>
                )}

                {/* Book Button */}
                <button
                  onClick={handleBookSlot}
                  disabled={!bookingModal.selectedSlot || bookingInProgress}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all cursor-pointer"
                >
                  {bookingInProgress ? (
                    <>
                      <LoaderCircle className="animate-spin" size={16} /> Booking & creating Meet link...
                    </>
                  ) : (
                    <>
                      <Video size={16} /> Book Interview
                    </>
                  )}
                </button>

                <p className="text-[10px] text-gray-400 text-center">
                  A Google Calendar invite with a Meet link will be sent to both you and the recruiter.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
