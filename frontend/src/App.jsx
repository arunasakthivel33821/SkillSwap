import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentDashboard from "./pages/StudentDashboard";
import SkillProfile from "./pages/SkillProfile";
import SkillListing from "./pages/SkillListing";
import SessionRequests from "./pages/SessionRequests";
import Chat from "./pages/Chat";
import AdminDashboard from "./pages/AdminDashboard";
import Leaderboard from "./pages/Leaderboard";
import Notifications from "./pages/Notifications";

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === "admin" ? "/admin" : "/dashboard"} replace />;
}

function PrivateRoute({ children, studentOnly, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-primary font-medium">Loading...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (studentOnly && user.role !== "student") return <Navigate to="/admin" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route path="dashboard" element={<PrivateRoute studentOnly><StudentDashboard /></PrivateRoute>} />
        <Route path="skills" element={<PrivateRoute studentOnly><SkillProfile /></PrivateRoute>} />
        <Route path="browse" element={<PrivateRoute studentOnly><SkillListing /></PrivateRoute>} />
        <Route path="sessions" element={<PrivateRoute studentOnly><SessionRequests /></PrivateRoute>} />
        <Route path="chat" element={<PrivateRoute studentOnly><Chat /></PrivateRoute>} />
        <Route path="chat/:sessionId" element={<PrivateRoute studentOnly><Chat /></PrivateRoute>} />
        <Route path="leaderboard" element={<PrivateRoute studentOnly><Leaderboard /></PrivateRoute>} />
        <Route path="notifications" element={<PrivateRoute studentOnly><Notifications /></PrivateRoute>} />
        <Route path="admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
        <Route path="admin/students" element={<PrivateRoute adminOnly><AdminDashboard tab="students" /></PrivateRoute>} />
        <Route path="admin/skills" element={<PrivateRoute adminOnly><AdminDashboard tab="skills" /></PrivateRoute>} />
        <Route path="admin/sessions" element={<PrivateRoute adminOnly><AdminDashboard tab="sessions" /></PrivateRoute>} />
        <Route path="admin/leaderboard" element={<PrivateRoute adminOnly><AdminDashboard tab="leaderboard" /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
