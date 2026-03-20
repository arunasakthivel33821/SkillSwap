import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

export default function StudentDashboard() {
  const { user, updateUser } = useAuth();
  const [mySkillsCount, setMySkillsCount] = useState(0);
  const [sessionsLearnerCount, setSessionsLearnerCount] = useState(0);
  const [sessionsMentorCount, setSessionsMentorCount] = useState(0);

  useEffect(() => {
    api.get("/api/auth/me").then((r) => updateUser(r.data)).catch(() => {});
  }, [updateUser]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/api/skills/my")
      .then((r) => setMySkillsCount((r.data || []).length))
      .catch(() => setMySkillsCount(0));
    api
      .get("/api/sessions/my")
      .then((r) => {
        const asLearner = ((r.data && r.data.asLearner) || []);
        const asMentor = ((r.data && r.data.asMentor) || []);
        setSessionsLearnerCount(asLearner.length);
        setSessionsMentorCount(asMentor.length);
      })
      .catch(() => {
        setSessionsLearnerCount(0);
        setSessionsMentorCount(0);
      });
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const stats = [
    { label: "Your Points", value: user?.points ?? 0, description: "Earn points by mentoring" },
    { label: "Skills to Teach", value: mySkillsCount || 0, description: "Share your expertise" },
    { label: "Sessions Joined", value: (sessionsLearnerCount + sessionsMentorCount) || 0, description: `Learner: ${sessionsLearnerCount} • Mentor: ${sessionsMentorCount}` },
  ];

  const quickLinks = [
    { to: "/skills", label: "My Skills", desc: "Manage what you teach", icon: "🎯" },
    { to: "/browse", label: "Browse Skills", desc: "Find something new", icon: "🔍" },
    { to: "/sessions", label: "Sessions", desc: "Your learning sessions", icon: "📅" },
    { to: "/chat", label: "Chat", desc: "Connect with peers", icon: "💬" },
    { to: "/leaderboard", label: "Leaderboard", desc: "Top mentors", icon: "🏆" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {getGreeting()}, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your learning journey</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="stat-card animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                <p className="text-4xl font-bold text-gray-800 mt-2">{stat.value}</p>
                <p className="text-gray-400 text-sm mt-1">{stat.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link, index) => (
          <Link
            key={link.to}
            to={link.to}
            className={`card-elevated p-5 group animate-fade-in flex items-center gap-4`}
            style={{ animationDelay: `${(index + 3) * 100}ms` }}
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl transition-transform group-hover:scale-110">
              {link.icon}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors">
                {link.label}
              </h3>
              <p className="text-gray-500 text-sm">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
