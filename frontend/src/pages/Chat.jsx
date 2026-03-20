import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { sessionId: paramSessionId } = useParams();
  const [sessionListLearner, setSessionListLearner] = useState([]);
  const [sessionListMentor, setSessionListMentor] = useState([]);
  const [roomsAsMentor, setRoomsAsMentor] = useState([]);
  const [roomsAsMember, setRoomsAsMember] = useState([]);
  const [activeTab, setActiveTab] = useState("learner");
  const [selectedItem, setSelectedItem] = useState(null); // { kind: 'session'|'room', data }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get("/api/sessions/my"),
      api.get("/api/chat/rooms/my"),
    ])
      .then(([sRes, rRes]) => {
        const asLearner = (sRes.data.asLearner || []).filter((s) =>
          ["accepted", "rescheduled", "completed"].includes(s.status)
        );
        const asMentor = (sRes.data.asMentor || []).filter((s) =>
          ["accepted", "rescheduled", "completed"].includes(s.status)
        );
        setSessionListLearner(asLearner);
        setSessionListMentor(asMentor);
        setRoomsAsMentor(rRes.data.asMentor || []);
        setRoomsAsMember(rRes.data.asMember || []);
        const fromParam =
          paramSessionId &&
          [...asLearner, ...asMentor].find((s) => s._id === paramSessionId);
        setSelectedItem(
          fromParam ? { kind: "session", data: fromParam } : null
        );
      })
      .catch(() => {
        setSessionListLearner([]);
        setSessionListMentor([]);
        setRoomsAsMentor([]);
        setRoomsAsMember([]);
      })
      .finally(() => setLoading(false));
  }, [paramSessionId]);

  useEffect(() => {
    if (!selectedItem) {
      setMessages([]);
      return;
    }
    if (selectedItem.kind === "session") {
      api
        .get("/api/chat/session/" + selectedItem.data._id)
        .then((r) => setMessages(r.data))
        .catch(() => setMessages([]));
    } else {
      api
        .get("/api/chat/rooms/" + selectedItem.data._id + "/messages")
        .then((r) => setMessages(r.data))
        .catch(() => setMessages([]));
    }
  }, [selectedItem]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedItem || sending) return;
    setSending(true);
    try {
      let r;
      if (selectedItem.kind === "session") {
        r = await api.post("/api/chat", {
          sessionId: selectedItem.data._id,
          message: newMessage.trim(),
        });
      } else {
        r = await api.post(
          "/api/chat/rooms/" + selectedItem.data._id + "/messages",
          { message: newMessage.trim() }
        );
      }
      setMessages((prev) => [...prev, r.data]);
      setNewMessage("");
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSending(false);
    }
  };

  const other =
    selectedItem && selectedItem.kind === "session"
      ? selectedItem.data.mentorId?._id === user?._id
        ? selectedItem.data.learnerId
        : selectedItem.data.mentorId
      : null;

  // Group messages by date
  const groupedMessages = messages.reduce((acc, message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(message);
    return acc;
  }, {});

  


  const removeMember = async (roomId, userId) => {
    try {
      await api.delete("/api/chat/rooms/" + roomId + "/members/" + userId);
      const r = await api.get("/api/chat/rooms/my");
      const updated = (r.data.asMentor || []).find((x) => x._id === roomId);
      if (updated && selectedItem?.kind === "room" && selectedItem.data._id === roomId) {
        setSelectedItem({ kind: "room", data: updated });
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="section-title">Chat</h1>
          <p className="section-subtitle">Connect with your learning partners</p>
        </div>
        <div className="flex gap-4 flex-col lg:flex-row">
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="card animate-pulse h-96" />
          </div>
          <div className="flex-1 card animate-pulse h-96" />
        </div>
      </div>
    );
  }

  if (
    sessionListLearner.length === 0 &&
    sessionListMentor.length === 0 &&
    roomsAsMentor.length === 0 &&
    roomsAsMember.length === 0
  ) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="section-title">Chat</h1>
          <p className="section-subtitle">Connect with your learning partners</p>
        </div>
        <div className="card text-center py-16">
          <h3 className="text-xl font-bold text-gray-800 mb-2">No chats yet</h3>
          <p className="text-gray-500 mb-6">Chat is available after a session is accepted</p>
          <Link to="/sessions" className="btn-primary inline-block">
            Go to Sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title">Chat</h1>
        <p className="section-subtitle">Coordinate with your mentor or learner</p>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Left: Chats list */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="card">
            <div className="flex gap-2 mb-4">
              <button
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  activeTab === "learner" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setActiveTab("learner")}
              >
                Learner Chats
              </button>
              <button
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  activeTab === "mentor" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setActiveTab("mentor")}
              >
                Mentor Chats
              </button>
            </div>
            <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
              {activeTab === "learner" ? "Learner Chats" : "Mentor Chats"}
            </h2>
            <div className="space-y-2">
              {activeTab === "learner" && (
                <>
                  {(sessionListLearner || []).map((s) => {
                    const active = selectedItem?.kind === "session" && selectedItem?.data?._id === s._id;
                    return (
                      <div key={s._id} className="rounded-xl">
                        <button
                          onClick={() => setSelectedItem({ kind: "session", data: s })}
                          className={`w-full text-left p-3 rounded-xl transition-all ${
                            active ? "bg-primary text-white shadow-lg" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div className="font-medium truncate">{s.mentorId?.name}</div>
                          <div className={`text-xs ${active ? "text-primary-pale" : "text-gray-500"}`}>
                            {s.skillId?.title} | {new Date(s.date).toLocaleDateString()} {s.timeSlot}
                          </div>
                          <div className={`text-xs ${active ? "text-primary-pale" : "text-gray-400"}`}>Private</div>
                        </button>
                      </div>
                    );
                  })}
                  {(roomsAsMember || []).map((r) => null)}
                </>
              )}
              {activeTab === "mentor" && (
                <>
                  {(sessionListMentor || []).map((s) => {
                    const active = selectedItem?.kind === "session" && selectedItem?.data?._id === s._id;
                    return (
                      <div key={s._id} className="rounded-xl">
                        <button
                          onClick={() => setSelectedItem({ kind: "session", data: s })}
                          className={`w-full text-left p-3 rounded-xl transition-all ${
                            active ? "bg-primary text-white shadow-lg" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div className="font-medium truncate">{s.learnerId?.name}</div>
                          <div className={`text-xs ${active ? "text-primary-pale" : "text-gray-500"}`}>
                            {s.skillId?.title} | {new Date(s.date).toLocaleDateString()} {s.timeSlot}
                          </div>
                          <div className={`text-xs ${active ? "text-primary-pale" : "text-gray-400"}`}>Private</div>
                        </button>
                      </div>
                    );
                  })}
                  {(roomsAsMentor || []).map((r) => {
                    const active = selectedItem?.kind === "room" && selectedItem?.data?._id === r._id;
                    return (
                      <div key={r._id} className="rounded-xl">
                        <button
                          onClick={() => setSelectedItem({ kind: "room", data: r })}
                          className={`w-full text-left p-3 rounded-xl transition-all ${
                            active ? "bg-primary text-white shadow-lg" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div className="font-medium truncate">
                            {r.members?.map((m) => m.name).join(", ") || "No members yet"}
                          </div>
                          <div className={`text-xs ${active ? "text-primary-pale" : "text-gray-500"}`}>
                            {r.skill} | {new Date(r.date).toLocaleDateString()} {r.timeSlot}
                          </div>
                          <div className={`text-xs ${active ? "text-primary-pale" : "text-gray-400"}`}>Group</div>
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 card flex flex-col min-h-[500px]">
          {selectedItem && (
            <>
              {/* Chat header */}
              <div className="border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="avatar-lg">
                    {selectedItem.kind === "session"
                      ? other?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : "GC"}
                  </div>
                  <div>
                    {selectedItem.kind === "session" ? (
                      <>
                        <h3 className="font-bold text-gray-800">{other?.name}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedItem.data.skillId?.title} | {new Date(selectedItem.data.date).toLocaleDateString()}{" "}
                          {selectedItem.data.timeSlot}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Private</p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-bold text-gray-800">
                          {selectedItem.data.members?.map((m) => m.name).join(", ") || "Group Chat"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {selectedItem.data.skill} | {new Date(selectedItem.data.date).toLocaleDateString()}{" "}
                          {selectedItem.data.timeSlot}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Group</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 min-h-[300px] max-h-[400px] px-2">
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="text-center text-gray-400 text-sm my-4">
                      <span className="bg-gray-100 px-3 py-1 rounded-full">{date}</span>
                    </div>
                    {msgs.map((m) => (
                      <div
                        key={m._id}
                        className={`flex ${m.senderId?._id === user?._id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] ${
                            m.senderId?._id === user?._id ? "message-sent" : "message-received"
                          } px-4 py-2.5`}
                        >
                          <p className="font-semibold text-xs mb-1">{m.senderId?.name}</p>
                          <p>{m.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              m.senderId?._id === user?._id ? "text-primary-pale" : "text-gray-400"
                            }`}
                          >
                            {new Date(m.createdAt).toLocaleDateString()}{" "}
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Mentor group member management */}
              {selectedItem?.kind === "room" && selectedItem.data.mentorId === user?._id && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Members</h4>
                  <div className="space-y-2">
                    {(selectedItem.data.members || []).map((m) => (
                      <div key={m._id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{m.name}</span>
                        <button
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => removeMember(selectedItem.data._id, m._id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form onSubmit={sendMessage} className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field flex-1"
                />
                <button
                  type="submit"
                  className="btn-primary px-6"
                  disabled={sending || !newMessage.trim()}
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}