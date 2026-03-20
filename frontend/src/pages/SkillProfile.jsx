import React, { useState, useEffect } from "react";
import { api } from "../api";

export default function SkillProfile() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const fetchSkills = () => {
    api
      .get("/api/skills/my")
      .then((r) => setSkills(r.data))
      .catch(() => setSkills([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  // Helper to normalize skill title (lowercase, trimmed)
  const normalizeTitle = (t) => t.trim().toLowerCase();

  // Helper to format title for display (capitalize first letter)
  const formatTitle = (t) => {
    const normalized = normalizeTitle(t);
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Normalize title for comparison and storage
    const normalizedTitle = normalizeTitle(title);

    // Check for duplicates (case-insensitive)
    const isDuplicate = skills.some((s) => normalizeTitle(s.title) === normalizedTitle);
    if (isDuplicate) {
      setError("A skill with this name already exists");
      return;
    }

    try {
      if (editingId) {
        await api.patch("/api/skills/" + editingId, { title: formatTitle(title), category });
        setEditingId(null);
      } else {
        await api.post("/api/skills", { title: formatTitle(title), category });
      }
      setTitle("");
      setCategory("");
      fetchSkills();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const startEdit = (s) => {
    setEditingId(s._id);
    setTitle(formatTitle(s.title));
    setCategory(s.category);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setCategory("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this skill?")) return;
    try {
      await api.delete("/api/skills/" + id);
      fetchSkills();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

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
        <h1 className="section-title">My Skills</h1>
        <p className="section-subtitle">Showcase your expertise and help fellow students learn</p>
      </div>

      {/* Add/Edit form */}
      <div className="card-elevated mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            {editingId ? "Edit Skill" : "Add a New Skill"}
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
            <span>!</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Skill Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g. Python Programming"
              required
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
              placeholder="e.g. Programming"
              required
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              {editingId ? "Update" : "Add Skill"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Skills list */}
      <div className="card-elevated">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-gray-800">My Skills ({skills.length})</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold text-gray-800 mb-2">No skills yet</h3>
            <p className="text-gray-500">Add your first skill above to start teaching!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {skills.map((s) => (
              <li
                key={s._id}
                className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-xl">
                    🎯
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">{formatTitle(s.title)}</span>
                    <span className="text-gray-400 mx-2">|</span>
                    <span className={`badge ${getCategoryColor(s.category)}`}>{s.category}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(s)} className="btn-ghost text-primary">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(s._id)} className="btn-ghost text-red-500 hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}