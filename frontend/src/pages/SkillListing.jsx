import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function SkillListing() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [teachingMode, setTeachingMode] = useState("flexible");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/api/skills")
      .then(({ data }) => setSkills(data))
      .catch(() => setSkills([]))
      .finally(() => setLoading(false));
  }, []);

  const openRequest = (skill) => {
    setSelectedSkill(skill);
    setDate("");
    setTimeSlot("");
    setTeachingMode("flexible");
    setShowModal(true);
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!selectedSkill) return;
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const chosenDate = new Date(date);
    if (chosenDate < todayMidnight) {
      alert("Please select today or a future date");
      return;
    }
    // Validate time slot for same-day requests
    const todayStr = new Date().toISOString().slice(0, 10);
    if (date === todayStr) {
      if (!availableSlots || !availableSlots.includes(timeSlot)) {
        alert("Please select a valid future time slot for today");
        return;
      }
    }

    setRequestingId(selectedSkill._id);
    try {
      await api.post("/api/sessions", {
        skillId: selectedSkill._id,
        date: new Date(date).toISOString(),
        timeSlot,
        teachingMode,
      });
      setShowModal(false);
      setSelectedSkill(null);
      navigate("/sessions");
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setRequestingId(null);
    }
  };

  const myId = user?._id;
  const q = searchQuery.trim().toLowerCase();
  const filtered = skills.filter((s) => {
    const isMine = s.mentorId?._id === myId;
    if (!q) return !isMine;

    let fields = [];
    if (searchType === "all") {
      fields = [s.title, s.category, s.mentorId?.name];
    } else if (searchType === "title") {
      fields = [s.title];
    } else if (searchType === "mentor") {
      fields = [s.mentorId?.name];
    } else if (searchType === "category") {
      fields = [s.category];
    }

    const normalizedFields = fields
      .filter(Boolean)
      .map((v) => String(v).toLowerCase());
    return normalizedFields.some((v) => v.includes(q));
  });

  // compute available 1-hour slots (9:00 AM - 6:00 PM)
  const availableSlots = useMemo(() => {
    const slots = Array.from({ length: 9 }).map((_, i) => {
      const startHour = 9 + i; // 9..17 -> last slot 17-18
      const endHour = startHour + 1;
      const format = (h) => {
        const period = h >= 12 ? "PM" : "AM";
        const hour12 = ((h + 11) % 12) + 1;
        return `${hour12}:00 ${period}`;
      };
      return `${format(startHour)} - ${format(endHour)}`;
    });

    if (!date) return slots;

    const selected = new Date(date);
    const today = new Date();
    selected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (selected.getTime() !== today.getTime()) return slots;

    // For today, filter out past slots
    const now = new Date();
    let threshold = now.getHours();
    if (now.getMinutes() > 0) threshold += 1; // next full hour

    return slots.filter((label) => {
      const startStr = label.split(" - ")[0]; // e.g. "2:00 PM"
      const [timePart, period] = startStr.split(" ");
      const hour = parseInt(timePart.split(":")[0], 10);
      let h24 = hour % 12;
      if (period === "PM") h24 += 12;
      return h24 >= threshold;
    });
  }, [date]);

  const getCategoryColor = (category) => {
    const colors = {
      programming: "bg-blue-100 text-blue-700",
      design: "bg-pink-100 text-pink-700",
      language: "bg-green-100 text-green-700",
      music: "bg-purple-100 text-purple-700",
      business: "bg-yellow-100 text-yellow-700",
      science: "bg-cyan-100 text-cyan-700",
    };
    const key = category?.toLowerCase().split(" ")[0] || "default";
    return colors[key] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title">Browse Skills</h1>
        <p className="section-subtitle">
          Discover skills offered by your peers and request a session to learn
        </p>
      </div>
      <div className="mb-6 flex gap-3">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="input-field w-32 sm:w-48"
        >
          <option value="all">All</option>
          <option value="title">Title</option>
          <option value="category">Category</option>
          <option value="mentor">Mentor</option>
        </select>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-10"
            placeholder="Search skills..."
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-10 bg-gray-200 rounded w-full mt-4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="text-xl font-bold text-gray-800 mb-2">No skills available</h3>
          <p className="text-gray-500">Check back later or add your own skills!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((skill) => (
            <div key={skill._id} className="card-elevated group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-xl text-gray-800 group-hover:text-primary transition-colors">
                  {skill.title}
                </h3>
                <span className={`badge ${getCategoryColor(skill.category)}`}>
                  {skill.category}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">Mentor: {skill.mentorId?.name} {skill.mentorId?._id === myId && "(You)"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <span>{skill.mentorId?.points ?? 0} points</span>
                </div>
              </div>

              {skill.mentorId?._id === myId ? (
                <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
                  Your Skill
                </button>
              ) : (
                <button onClick={() => openRequest(skill)} className="btn-primary w-full">
                  Request Session
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedSkill && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="card-elevated max-w-md w-full animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Request Session</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                X
              </button>
            </div>

            <div className="mb-4 p-3 bg-primary/5 rounded-xl">
              <p className="font-semibold text-primary">{selectedSkill.title}</p>
              <p className="text-sm text-gray-500">with {selectedSkill.mentorId?.name}</p>
            </div>

            <form onSubmit={submitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                  min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time Slot (1 hour)
                </label>
                <input
                  list="time-slots"
                  type="text"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="input-field"
                  placeholder="Select or type to search time..."
                  required
                />
                <datalist id="time-slots">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((label) => <option key={label} value={label} />)
                  ) : (
                    <option value="" />
                  )}
                </datalist>
                {availableSlots.length === 0 && (
                  <p className="text-sm text-red-500 mt-2">No remaining time slots available for the selected date.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teaching Mode
                </label>
                <select
                  value={teachingMode}
                  onChange={(e) => setTeachingMode(e.target.value)}
                  className="input-field"
                >
                  <option value="in-person">In-Person (Inside Campus(KEC))</option>
                  <option value="online">Online (Google Meet / Zoom)</option>
                  <option value="flexible">Flexible (Discuss with mentor)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={!!requestingId}>
                  {requestingId ? "Sending..." : "Send Request"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
