import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data } = await api.get("/api/notifications");
        const unread = data.filter((n) => !n.read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?"
    );
  };

  const studentLinks = [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/skills", label: "My Skills", icon: "🎯" },
    { to: "/browse", label: "Browse Skills", icon: "🔍" },
    { to: "/sessions", label: "Sessions", icon: "📅" },
    { to: "/chat", label: "Chat", icon: "💬" },
    { to: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  ];

  const adminLinks = [
    { to: "/admin", label: "Dashboard", icon: "📊" },
    { to: "/admin/students", label: "Students", icon: "👥" },
    { to: "/admin/skills", label: "Skills", icon: "🎯" },
    { to: "/admin/sessions", label: "Sessions", icon: "📅" },
    { to: "/admin/leaderboard", label: "Leaderboard", icon: "🏆" },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 lg:static lg:inset-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <NavLink
              to={isAdmin ? "/admin" : "/dashboard"}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-lg">
                🌱
              </div>
              <div>
                <h1 className="font-bold text-gray-800">SkillSwap</h1>
                <p className="text-xs text-gray-500">Campus</p>
              </div>
            </NavLink>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-primary to-primary-light text-white shadow-lg"
                      : "text-gray-600 hover:bg-primary/5 hover:text-primary"
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                {link.icon && <span className="text-lg">{link.icon}</span>}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="text-xs text-gray-400">SkillSwap Campus</div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <NavLink
              to="/notifications"
              className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              title="Notifications"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>

              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </NavLink>

            {/* User Section */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50">
              <div className="avatar">{getInitials(user?.name)}</div>

              <div className="hidden sm:block">
                <p className="font-semibold text-gray-800 leading-none">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                title="Logout"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <div className="mb-6 bg-gradient-to-r from-primary/10 to-primary-light/10 border border-primary/20 rounded-xl px-4 py-3">
            <p className="text-sm text-primary-dark">
              Teaching happens outside the platform using mutually agreed methods
              (e.g. in-person, Google Meet, WhatsApp).
            </p>
          </div>

          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
