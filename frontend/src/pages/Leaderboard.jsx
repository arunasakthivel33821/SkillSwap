import React, { useState, useEffect } from "react";
import { api } from "../api";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/leaderboard")
      .then((r) => setLeaders(r.data))
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false));
  }, []);

  const getRankBadge = (index) => {
    if (index === 0) return { label: "1", bg: "bg-yellow-100", color: "text-yellow-700" };
    if (index === 1) return { label: "2", bg: "bg-gray-100", color: "text-gray-700" };
    if (index === 2) return { label: "3", bg: "bg-orange-100", color: "text-orange-700" };
    return { label: `${index + 1}`, bg: "bg-gray-50", color: "text-gray-500" };
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="section-title">Leaderboard</h1>
          <p className="section-subtitle">Top student mentors by points earned</p>
        </div>
        <div className="card animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title">Leaderboard</h1>
        <p className="section-subtitle">Top student mentors by points earned</p>
      </div>

      {/* Top 3 podium */}
      {leaders.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {[1, 0, 2].map((index) => {
            const user = leaders[index];
            const badge = getRankBadge(index);
            const height = index === 0 ? "h-40" : index === 1 ? "h-32" : "h-24";
            return (
              <div
                key={index}
                className="flex flex-col items-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`w-20 ${height} rounded-t-2xl bg-gradient-to-t from-primary to-primary-light flex items-center justify-center`}
                >
                  <div className="text-center text-white">
                    <div className="text-3xl mb-1">{badge.label}</div>
                    <div className="font-bold">{user?.points}</div>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p className="font-bold text-gray-800">{user?.name}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full leaderboard table */}
      <div className="card-elevated overflow-hidden">
        {leaders.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold text-gray-800 mb-2">No data yet</h3>
            <p className="text-gray-500">Leaderboard will appear once students earn points</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Rank</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Student</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Email</th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-600">Points</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((u, i) => {
                  const badge = getRankBadge(i);
                  return (
                    <tr
                      key={u._id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${badge.bg} ${badge.color} font-bold`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            {u.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <span className="font-semibold text-gray-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{u.email}</td>
                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
                          {u.points}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
