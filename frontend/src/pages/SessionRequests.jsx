import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending" },
  accepted: { color: "bg-green-100 text-green-700", label: "Accepted" },
  rescheduled: { color: "bg-blue-100 text-blue-700", label: "Rescheduled" },
  completed: { color: "bg-gray-100 text-gray-700", label: "Completed" },
};

export default function SessionRequests() {
  const [sessions, setSessions] = useState({ asLearner: [], asMentor: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/sessions/my")
      .then((r) => {
        const data = r.data;
        if (data.asMentor) data.asMentor = data.asMentor.filter(s => s.status !== 'rejected');
        if (data.asLearner) data.asLearner = data.asLearner.filter(s => s.status !== 'rejected');
        setSessions(data);
      })
      .catch(() => setSessions({ asLearner: [], asMentor: [] }))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id, action) => {
    try {
      let status;
      if (action === "accept") status = "accepted";
      else if (action === "reject") status = "rejected";
      else if (action === "complete") {
        // For "Mark Complete", send a completion request to the learner
        await api.post(`/api/sessions/${id}/request-completion`);
        alert("Completion request sent to the learner. They will be notified to confirm.");
        fetchSessions();
        return;
      } else status = "rejected"; // default fallback

      setSessions((prev) => ({
        asLearner: prev.asLearner.map(s => s._id === id ? { ...s, status } : s),
        asMentor: action === 'reject'
          ? prev.asMentor.filter(s => s._id !== id)
          : prev.asMentor.map(s => s._id === id ? { ...s, status } : s)
      }));

      // Send the API request to update the session status
      const response = await api.patch(`/api/sessions/${id}`, { status });

      if (!response.data || response.data.error) {
        console.error(response.data.error || "Unknown error");
        alert(response.data?.error || "Failed to update session status.");
        // Revert the optimistic update in case of an error
        fetchSessions();
      }
    } catch (error) {
      console.error(`Failed to ${action} session`, error);
      alert(error.message || "Failed to update session status.");
      // Revert the optimistic update in case of an error
      fetchSessions();
    }
  };

  const handleNotification = async (id, action) => {
    try {
      const status = action === "accept" ? "accepted" : "rejected";

      // Send the API request to update the session status
      await api.patch(`/api/sessions/${id}`, { status });

      alert(`Notification sent for ${action} action.`);
    } catch (error) {
      console.error(`Failed to send notification for ${action} action`, error);
      alert("Failed to send notification.");
    }
  };

  const handleRemove = (id) => {
    // Remove the session card from the UI
    setSessions((prev) => ({
      asLearner: prev.asLearner.filter((s) => s._id !== id),
      asMentor: prev.asMentor.filter((s) => s._id !== id)
    }));
  };

  const handleReschedule = async (id) => {
    const newDate = prompt("Enter new date (YYYY-MM-DD):");
    if (!newDate) return;
    const newTime = prompt("Enter new time slot (e.g., 2:00 PM - 3:00 PM):");
    if (!newTime) return;

    try {
      const status = "rescheduled";
      const response = await api.patch(`/api/sessions/${id}`, { status, date: newDate, timeSlot: newTime });

      if (!response.data || response.data.error) {
        throw new Error(response.data?.error || "Unknown error from server");
      }

      fetchSessions();
      alert("Session rescheduled successfully.");
    } catch (error) {
      alert(error.response?.data?.error || error.message || "Failed to reschedule session.");
    }
  };

  function SessionCard({ s, asMentor }) {
    const other = asMentor ? s.learnerId : s.mentorId;
    const skill = s.skillId;
    const canAccept = asMentor && s.status === "pending";
    const canComplete = asMentor && (s.status === "accepted" || s.status === "rescheduled");
    const canReschedule = asMentor && ["pending", "accepted", "rescheduled"].includes(s.status);
    const canChat = ["accepted", "rescheduled", "completed"].includes(s.status);
    const canReject = asMentor && s.status === "pending";
    const config = statusConfig[s.status] || statusConfig.pending;

    return (
      <div className="card-elevated mb-4 relative">
        {/* Status badge in top right corner */}
        <span className={`badge ${config.color} absolute top-4 right-4`}>{config.label}</span>
        
        {/* Main content area */}
        <div className="flex items-start gap-4 pr-20">
          <div
            className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center text-xl flex-shrink-0`}
          >
            {config.label[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-lg">{skill?.title}</h3>
            <p className="text-gray-500 text-sm">{skill?.category}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>
                {asMentor ? "Teaching" : "Learning from"}: <strong>{other?.name}</strong>
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>{new Date(s.date).toLocaleDateString()}</span>
              <span>{s.timeSlot}</span>
              <span>{s.teachingMode}</span>
            </div>
          </div>
        </div>

        {/* Action buttons at the bottom */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
          {canAccept && (
            <button
              onClick={() => handleAction(s._id, "accept")}
              className="px-4 py-2 bg-[#1B4332] text-white rounded-xl font-medium hover:bg-[#0D2818] transition-colors shadow-md hover:shadow-lg text-sm whitespace-nowrap"
            >
              Accept
            </button>
          )}

          {canReject && (
            <button
              onClick={() => handleAction(s._id, "reject")}
              className="px-4 py-2 bg-red-700 text-white rounded-xl font-medium hover:bg-red-800 transition-colors shadow-md hover:shadow-lg text-sm whitespace-nowrap"
            >
              Reject
            </button>
          )}

          {canComplete && (
            <button
              onClick={() => handleAction(s._id, "complete")}
              className="px-4 py-2 bg-[#1B4332] text-white rounded-xl font-medium hover:bg-[#0D2818] transition-colors shadow-md hover:shadow-lg text-sm whitespace-nowrap"
            >
              Mark Complete
            </button>
          )}

          {canReschedule && (
            <button
              onClick={() => handleReschedule(s._id)}
              className="px-4 py-2 bg-white border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary/5 transition-colors shadow-md hover:shadow-lg text-sm whitespace-nowrap"
            >
              Reschedule
            </button>
          )}

          {canChat && (
            <Link 
              to={"/chat/" + s._id} 
              className="px-4 py-2 bg-white border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary/5 transition-colors shadow-md hover:shadow-lg text-sm whitespace-nowrap inline-block text-center"
            >
              Chat
            </Link>
          )}

          {s.status === "completed" && (
            <button
              onClick={() => handleRemove(s._id)}
              className="px-4 py-2 bg-red-700 text-white rounded-xl font-medium hover:bg-red-800 transition-colors shadow-md hover:shadow-lg text-sm whitespace-nowrap"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    );
  }

  const fetchSessions = () => {
    api
      .get("/api/sessions/my")
      .then((r) => {
        const data = r.data;
        if (data.asMentor) data.asMentor = data.asMentor.filter(s => s.status !== 'rejected');
        if (data.asLearner) data.asLearner = data.asLearner.filter(s => s.status !== 'rejected');
        setSessions(data);
      })
      .catch(() => setSessions({ asLearner: [], asMentor: [] }));
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="section-title">Sessions</h1>
          <p className="section-subtitle">Manage your learning and teaching sessions</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title">Sessions</h1>
        <p className="section-subtitle">Track your learning and teaching sessions</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* As Learner */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-800">As Learner</h2>
            <span className="badge badge-info">{sessions.asLearner.length}</span>
          </div>

          {sessions.asLearner.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">No learning sessions yet</p>
              <Link to="/browse" className="btn-primary mt-4 inline-block">
                Browse Skills
              </Link>
            </div>
          ) : (
            sessions.asLearner.map((s) => <SessionCard key={s._id} s={s} asMentor={false} />)
          )}
        </div>

        {/* As Mentor */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-800">As Mentor</h2>
            <span className="badge badge-success">{sessions.asMentor.length}</span>
          </div>

          {sessions.asMentor.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">No teaching sessions yet</p>
              <Link to="/skills" className="btn-primary mt-4 inline-block">
                Add Skills
              </Link>
            </div>
          ) : (
            sessions.asMentor.map((s) => <SessionCard key={s._id} s={s} asMentor={true} />)
          )}
        </div>
      </div>
    </div>
  );
}
