"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LoaderCircle, Calendar, Clock, Save, Plus, Trash2, Info } from "lucide-react";

const DAYS = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

const DURATIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
];

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState([]);
  const [slotDuration, setSlotDuration] = useState(15);
  const [activeDays, setActiveDays] = useState(new Set());

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch("/api/availability");
        const data = await res.json();
        if (data.success && data.availability) {
          setSlots(data.availability.slots || []);
          setSlotDuration(data.availability.slotDuration || 15);
          const days = new Set(data.availability.slots.map((s) => s.day));
          setActiveDays(days);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, []);

  const toggleDay = (day) => {
    const updated = new Set(activeDays);
    if (updated.has(day)) {
      updated.delete(day);
      setSlots((prev) => prev.filter((s) => s.day !== day));
    } else {
      updated.add(day);
      setSlots((prev) => [...prev, { day, startTime: "09:00", endTime: "17:00" }]);
    }
    setActiveDays(updated);
  };

  const updateSlot = (day, field, value) => {
    setSlots((prev) =>
      prev.map((s) => (s.day === day ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async () => {
    if (slots.length === 0) {
      toast.error("Please select at least one day");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots, slotDuration }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderCircle className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="text-blue-500" size={24} />
          Interview Availability
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Set your weekly schedule so candidates can book screening calls.
        </p>
      </div>

      {/* Tip Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
        <div className="text-sm text-blue-700 leading-relaxed">
          <span className="font-semibold">How it works:</span> Toggle your available days, set time windows, and choose your slot duration.
          Candidates will see open slots for the next 14 days and can book directly. A Google Calendar event with a Meet link will be auto-created.
        </div>
      </div>

      {/* Slot Duration */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
          <Clock size={16} className="text-gray-400" />
          Slot Duration
        </label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setSlotDuration(d.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                slotDuration === d.value
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Weekly Schedule</h2>
          <p className="text-xs text-gray-400 mt-0.5">Toggle days and set your available hours</p>
        </div>

        <div className="divide-y divide-gray-100">
          {DAYS.map((day) => {
            const isActive = activeDays.has(day.value);
            const slot = slots.find((s) => s.day === day.value);

            return (
              <div
                key={day.value}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                  isActive ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                {/* Day Toggle */}
                <button
                  onClick={() => toggleDay(day.value)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                    isActive ? "bg-blue-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>

                {/* Day Name */}
                <span
                  className={`text-sm font-medium w-24 ${
                    isActive ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {day.label}
                </span>

                {/* Time Inputs */}
                {isActive && slot ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(day.value, "startTime", e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(day.value, "endTime", e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || slots.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all cursor-pointer shadow-md hover:shadow-lg"
      >
        {saving ? (
          <>
            <LoaderCircle className="animate-spin" size={16} /> Saving...
          </>
        ) : (
          <>
            <Save size={16} /> Save Availability
          </>
        )}
      </button>
    </div>
  );
}
