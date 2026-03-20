import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";

// Helper function to normalize skill titles for case-insensitive grouping
const normalizeSkillTitle = (title) => title?.toLowerCase().trim() || "";

// Get icon for a skill based on its name
const getSkillIcon = (title) => {
  const normalized = normalizeSkillTitle(title);
  
  const iconMap = {
    // Programming Languages
    'c': '🇨',
    'c++': '𝐂++',
    'c#': '🎯',
    'java': '☕',
    'javascript': '𝐉𝐒',
    'js': '𝐉𝐒',
    'typescript': '𝐓𝐒',
    'ts': '𝐓𝐒',
    'python': '🐍',
    'ruby': '💎',
    'go': '🐹',
    'rust': '🦀',
    'swift': '🍎',
    'kotlin': '🤖',
    'php': '🐘',
    'perl': '🐪',
    'scala': '⚡',
    
    // Web Technologies
    'react': '⚛️',
    'reactjs': '⚛️',
    'angular': '🅰️',
    'vue': '💚',
    'vuejs': '💚',
    'node': '🟢',
    'nodejs': '🟢',
    'express': '🚂',
    'html': '🌐',
    'css': '🎨',
    'sass': '💅',
    'less': '🟤',
    
    // Databases
    'mongodb': '🍃',
    'mysql': '🐬',
    'postgresql': '🐘',
    'redis': '🔴',
    'sql': '📊',
    'nosql': '📦',
    
    // Mobile Development
    'android': '🤖',
    'ios': '🍎',
    'react native': '⚛️',
    'flutter': '🦋',
    'mobile development': '📱',
    
    // Data Science & AI
    'machine learning': '🧠',
    'ml': '🧠',
    'deep learning': '🧠',
    'artificial intelligence': '🤖',
    'ai': '🤖',
    'data science': '📊',
    'data analysis': '📈',
    'pandas': '🐼',
    'numpy': '🔢',
    'tensorflow': '🧮',
    
    // DevOps & Cloud
    'docker': '🐳',
    'kubernetes': '⚓',
    'aws': '☁️',
    'azure': '🟦',
    'gcp': '☁️',
    'firebase': '🔥',
    'github': '🐙',
    'git': '📌',
    'ci/cd': '🔄',
    'jenkins': '⚙️',
    
    // Other Technologies
    'graphql': '🔮',
    'rest api': '🌐',
    'blockchain': '⛓️',
    'ethereum': '💎',
    'cybersecurity': '🔐',
    'security': '🔐',
    'networking': '🌐',
    'linux': '🐧',
    'unix': '💻',
    'windows': '🪟',
    
    // Soft Skills
    'communication': '💬',
    'leadership': '👑',
    'teamwork': '🤝',
    'problem solving': '🧩',
    'time management': '⏰',
    
    // Design
    'ui/ux': '🎨',
    'figma': '🎨',
    'adobe xd': '🎨',
    'photoshop': '🖼️',
    'illustrator': '✏️',
    
    // General
    'web development': '🌐',
    'software development': '💻',
    'programming': '💻',
    'coding': '💻',
    'development': '🛠️',
    'data structures': '📚',
    'algorithms': '📐',
    'dsa': '📚',
  };
  
  // Check exact match first
  if (iconMap[normalized]) {
    return iconMap[normalized];
  }
  
  // Check partial matches
  for (const [key, icon] of Object.entries(iconMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return icon;
    }
  }
  
  // Default icon
  return '💡';
};


// Group skills by normalized title (case-insensitive) and collect all students
const groupSkillsWithStudents = (skills, sessions) => {
  const skillGroups = new Map();
  
  skills.forEach((skill) => {
    const normalizedTitle = normalizeSkillTitle(skill.title);
    
    if (!skillGroups.has(normalizedTitle)) {
      skillGroups.set(normalizedTitle, {
        originalTitles: new Set(),
        categories: new Set(),
        skills: [],
        students: new Map(), // Map studentId -> student info
      });
    }
    
    const group = skillGroups.get(normalizedTitle);
    
    // Store original title (use the first one encountered)
    group.originalTitles.add(skill.title);
    group.categories.add(skill.category);
    group.skills.push(skill);
    
    // Find students who have this skill (from sessions where this skill was taught)
    const skillSessions = sessions.filter((s) => 
      s.skillId?._id === skill._id || s.skillId === skill._id
    );
    
    skillSessions.forEach((session) => {
      if (session.learnerId && !group.students.has(session.learnerId._id)) {
        group.students.set(session.learnerId._id, session.learnerId);
      }
    });
  });
  
  // Convert to array with display format
  return Array.from(skillGroups.entries()).map(([normalizedTitle, group]) => ({
    displayTitle: Array.from(group.originalTitles)[0] || normalizedTitle, // Use first original title for display
    normalizedTitle,
    categories: Array.from(group.categories),
    skillCount: group.skills.length,
    skills: group.skills,
    students: Array.from(group.students.values()),
    mergedCount: group.skills.length - 1, // Number of additional entries merged
  }));
};

export default function AdminDashboard({ tab: propTab }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathTab = location.pathname.replace("/admin", "").replace("/", "") || "dashboard";
  const tab = propTab || pathTab || "dashboard";

  const [stats, setStats] = useState({ userCount: 0, skillCount: 0, sessionCount: 0 });
  const [students, setStudents] = useState([]);
  const [skills, setSkills] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [skillSearchType, setSkillSearchType] = useState("all");
  const [expandedSkillTitle, setExpandedSkillTitle] = useState(null);

  useEffect(() => {
    if (tab === "dashboard" || !tab) {
      setLoading(true);
      Promise.all([
        api.get("/api/admin/stats"),
        api.get("/api/admin/skills"),
      ])
        .then(([statsRes, skillsRes]) => {
          setStats(statsRes.data);
          setSkills(skillsRes.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (tab === "students") {
      setLoading(true);
      Promise.all([
        api.get("/api/admin/students"),
        api.get("/api/admin/skills"),
        api.get("/api/admin/sessions"),
      ])
        .then(([studentsRes, skillsRes, sessionsRes]) => {
          setStudents(studentsRes.data);
          setSkills(skillsRes.data);
          setSessions(sessionsRes.data);
        })
        .catch(() => setStudents([]))
        .finally(() => setLoading(false));
    } else if (tab === "skills") {
      api
        .get("/api/admin/skills")
        .then((r) => setSkills(r.data))
        .catch(() => setSkills([]))
        .finally(() => setLoading(false));
    } else if (tab === "sessions") {
      api
        .get("/api/admin/sessions")
        .then((r) => setSessions(r.data))
        .catch(() => setSessions([]))
        .finally(() => setLoading(false));
    } else if (tab === "leaderboard") {
      api
        .get("/api/admin/leaderboard")
        .then((r) => setLeaderboard(r.data))
        .catch(() => setLeaderboard([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [tab]);

  const go = (t) => navigate("/admin" + (t === "dashboard" ? "" : "/" + t));

  const statCards = [
    { label: "Students", value: stats.userCount },
    { label: "Skills", value: stats.skillCount },
    { label: "Sessions", value: stats.sessionCount },
  ];

  const getStatusBadge = (status) => {
    const configs = {
      completed: "badge-success",
      accepted: "badge-info",
      pending: "badge-warning",
    };
    return configs[status] || "badge-neutral";
  };
  // Memoize grouped skills with students for case-insensitive matching
  const groupedSkills = useMemo(() => groupSkillsWithStudents(skills, sessions), [skills, sessions]);

  // Get unique available skills (from Skills module) - case-insensitive
  const uniqueAvailableSkills = useMemo(() => {
    const skillMap = new Map();
    
    skills.forEach((skill) => {
      const normalized = normalizeSkillTitle(skill.title);
      
      if (!skillMap.has(normalized)) {
        skillMap.set(normalized, {
          title: skill.title,
          category: skill.category,
          mentors: new Set(),
        });
      }
      
      const skillData = skillMap.get(normalized);
      if (skill.mentorId) {
        skillData.mentors.add(skill.mentorId._id || skill.mentorId);
      }
    });
    
    return Array.from(skillMap.values());
  }, [skills]);
  // Simple session card used by SessionsManagement
  
  function SessionCard({ session }) {
    const skill = session.skill || session.skillId?.title || session.skillId?.title;
    const mentorName = session.mentorName || session.mentorId?.name || session.mentorId?.name;
    const learnerName = session.learnerName || session.learnerId?.name || session.learnerId?.name;
    const mentorEmail = session.mentorEmail || session.mentorId?.email || session.mentorId?.email;
    const learnerEmail = session.learnerEmail || session.learnerId?.email || session.learnerId?.email;
      // Define statCards after uniqueAvailableSkills to avoid reference errors
  const statCards = [
    { label: "Students", value: stats.userCount, icon: "👥", color: "from-blue-400 to-indigo-400" },
    { label: "Skills", value: uniqueAvailableSkills.length, icon: "🛠️", color: "from-purple-400 to-pink-400" },
    { label: "Sessions", value: stats.sessionCount, icon: "📅", color: "from-green-400 to-emerald-400" },
  ];
    return (
      <div className="card-elevated p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-800">{skill}</h3>
            <p className="text-sm text-gray-500">
              <strong>Mentor:</strong> {mentorName} • {mentorEmail}
            </p>
            <p className="text-sm text-gray-500">
              <strong>Learner:</strong> {learnerName} • {learnerEmail}
            </p>
            <p className="text-xs text-gray-500 mt-2">{new Date(session.date).toLocaleDateString()}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`badge ${getStatusBadge(session.status)}`}>{session.status}</span>
          </div>
        </div>
      </div>
    );
  }

  // Sessions management UI for Admin tab
  function SessionsManagement({ sessions, loading }) {
    const [activeStatus, setActiveStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    const filteredSessions = useMemo(() => {
      return (sessions || []).filter((session) => {
        const matchesStatus = activeStatus === "all" || session.status === activeStatus;
        const searchLower = (searchTerm || "").toLowerCase().trim();
        if (!searchLower) return matchesStatus;

        const skill = (session.skill || session.skillId?.title || "").toLowerCase();
        const mentorName = (session.mentorName || session.mentorId?.name || "").toLowerCase();
        const learnerName = (session.learnerName || session.learnerId?.name || "").toLowerCase();
        const mentorEmail = (session.mentorEmail || session.mentorId?.email || "").toLowerCase();
        const learnerEmail = (session.learnerEmail || session.learnerId?.email || "").toLowerCase();

        const matchesSearch = searchLower.length === 1
          ? skill.includes(searchLower)
          : skill.includes(searchLower) ||
            mentorName.includes(searchLower) ||
            learnerName.includes(searchLower) ||
            mentorEmail.includes(searchLower) ||
            learnerEmail.includes(searchLower);

        return matchesStatus && matchesSearch;
      });
    }, [sessions, activeStatus, searchTerm]);

    const tabs = [
      { key: "all", label: "All Sessions", count: (sessions || []).length },
      { key: "pending", label: "Pending", count: (sessions || []).filter((s) => s.status === "pending").length },
      { key: "accepted", label: "Accepted", count: (sessions || []).filter((s) => s.status === "accepted").length },
      { key: "completed", label: "Completed", count: (sessions || []).filter((s) => s.status === "completed").length },
    ];

    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by skills,mentors,learner,email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveStatus(tab.key)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                activeStatus === tab.key
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeStatus === tab.key ? "bg-white/20" : "bg-gray-100"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-gray-100 rounded w-2/3 mb-4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No sessions found</h3>
            <p className="text-gray-500">
              {activeStatus === "all"
                ? "No sessions have been created yet"
                : `No ${activeStatus} sessions available`}
            </p>
          </div>
        ) : (
          <div key={searchTerm + activeStatus} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSessions.map((session) => (
              <SessionCard key={session.id || session._id} session={session} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const getPageTitle = () => {
    const titles = {
      dashboard: { title: "Admin Dashboard", subtitle: "Monitor and manage your campus learning community" },
      students: { title: "Students", subtitle: "View and manage all registered students" },
      skills: { title: "Skills Management", subtitle: "View skills offered by mentors" },
      sessions: { title: "Sessions Management", subtitle: "View and manage all learning sessions" },
      leaderboard: { title: "Leaderboard", subtitle: "Top mentors by points" },
    };
    return titles[tab] || titles.dashboard;
  };

  const pageInfo = getPageTitle();

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title">{pageInfo.title}</h1>
        <p className="section-subtitle">{pageInfo.subtitle}</p>
      </div>

      {/* Stats */}
      {(tab === "dashboard" || !tab) && (
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={stat.label}
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                  <p className="text-4xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                    index === 0
                      ? "from-blue-400 to-indigo-400"
                      : index === 1
                      ? "from-purple-400 to-pink-400"
                      : "from-green-400 to-emerald-400"
                  } flex items-center justify-center text-2xl shadow-lg`}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dashboard quick links */}
      {(tab === "dashboard" || !tab) && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-800">Available Skills</h2>
            <span className="badge badge-info">{uniqueAvailableSkills.length} skills</span>
          </div>
          
          {uniqueAvailableSkills.length === 0 ? (
            <div className="card-elevated p-8 text-center">
              <div className="text-4xl mb-2">🛠️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No skills available</h3>
              <p className="text-gray-500">Skills offered by mentors will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uniqueAvailableSkills.map((skill, index) => (
                <div
                  key={skill.title}
                  className="card-elevated p-5 flex items-center gap-4 hover:shadow-lg transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl shadow-md">
                      {getSkillIcon(skill.title)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-lg mb-2">{skill.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-neutral text-xs">{skill.category}</span>
                      <span className="text-sm text-gray-500">
                        {skill.mentors.size} {skill.mentors.size === 1 ? 'mentor' : 'mentors'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Students table */}
      {tab === "students" && (
        <div className="card-elevated overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-800">All Students</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-bold text-gray-800 mb-2">No students</h3>
              <p className="text-gray-500">No students registered yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Contact</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Points</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Skills</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((u) => {
                    const studentSkills = skills.filter((s) => s.mentorId?._id === u._id);
                    const studentSessionsAsLearner = sessions.filter((s) => s.learnerId?._id === u._id);
                    const studentSessionsAsMentor = sessions.filter((s) => s.mentorId?._id === u._id);
                    const expanded = expandedStudentId === u._id;
                    return (
                      <React.Fragment key={u._id}>
                        <tr
                          onClick={() => setExpandedStudentId(expanded ? null : u._id)}
                          className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="avatar text-xs">
                                {u.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>
                              <span className="font-medium">{u.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{u.email}</td>
                          <td className="py-3 px-4 text-gray-600">{u.contact || "-"}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-primary">{u.points ?? 0}</span>
                          </td>
                          <td className="py-3 px-4">{studentSkills.length}</td>
                          <td className="py-3 px-4">
                            {studentSessionsAsLearner.length + studentSessionsAsMentor.length}
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="border-t border-gray-100 bg-gray-50/50">
                            <td colSpan={6} className="py-4 px-4">
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="bg-white rounded-xl p-4">
                                  <h3 className="text-sm font-semibold text-primary mb-2">
                                    Skills (teaching)
                                  </h3>
                                  {studentSkills.length === 0 ? (
                                    <p className="text-sm text-gray-500">None</p>
                                  ) : (
                                    <ul className="text-sm space-y-1">
                                      {studentSkills.map((s) => (
                                        <li key={s._id} className="flex justify-between">
                                          <span>{s.title}</span>
                                          <span className="text-gray-500">{s.category}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                                <div className="bg-white rounded-xl p-4">
                                  <h3 className="text-sm font-semibold text-primary mb-2">Sessions</h3>
                                  {studentSessionsAsLearner.length === 0 &&
                                  studentSessionsAsMentor.length === 0 ? (
                                    <p className="text-sm text-gray-500">None</p>
                                  ) : (
                                    <ul className="text-sm space-y-2">
                                      {studentSessionsAsLearner.map((s) => (
                                        <li key={s._id} className="border-l-2 border-blue-300 pl-2">
                                          <span className="font-medium">Learner:</span> {s.skillId?.title} with{" "}
                                          {s.mentorId?.name} | {new Date(s.date).toLocaleDateString()} (
                                          {s.status})
                                        </li>
                                      ))}
                                      {studentSessionsAsMentor.map((s) => (
                                        <li key={s._id} className="border-l-2 border-green-300 pl-2">
                                          <span className="font-medium">Mentor:</span> {s.skillId?.title} with{" "}
                                          {s.learnerId?.name} | {new Date(s.date).toLocaleDateString()} (
                                          {s.status})
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Skills table */}
      {tab === "skills" && (
        <div className="card-elevated overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-800">Skills by Student</h2>
          </div>

          <div className="mb-6 flex gap-3">
            <select
              value={skillSearchType}
              onChange={(e) => setSkillSearchType(e.target.value)}
              className="input-field w-32 sm:w-48"
            >
              <option value="all">All</option>
              <option value="student">Student</option>
              <option value="skills">Skills</option>
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
                value={skillSearchQuery}
                onChange={(e) => setSkillSearchQuery(e.target.value)}
                className="input-field w-full pl-10"
                placeholder="Search..."
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : skills.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-bold text-gray-800 mb-2">No skills</h3>
              <p className="text-gray-500">No skills offered by students</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Student Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Skills</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(
                    skills
                      .filter((s) => {
                        const q = skillSearchQuery.trim().toLowerCase();
                        if (!q) return true;
                        const studentName = s.mentorId?.name?.toLowerCase() || "";
                        const skillTitle = s.title?.toLowerCase() || "";

                        if (skillSearchType === "student") {
                          return studentName.includes(q);
                        }
                        if (skillSearchType === "skills") {
                          return skillTitle.includes(q);
                        }
                        return studentName.includes(q) || skillTitle.includes(q);
                      })
                      .reduce((acc, skill) => {
                        const mentorId = skill.mentorId?._id;
                        if (!mentorId) return acc;
                        if (!acc[mentorId]) {
                          acc[mentorId] = {
                            mentor: skill.mentorId,
                            skills: [],
                          };
                        }
                        acc[mentorId].skills.push(skill);
                        return acc;
                      }, {})
                  ).map(({ mentor, skills: mentorSkills }) => (
                    <tr key={mentor._id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="avatar text-xs">
                            {mentor.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium">{mentor.name}</p>
                            <p className="text-xs text-gray-500">{mentor.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-2">
                          {mentorSkills.map((s) => (
                            <span key={s._id} className="badge badge-neutral">
                              {s.title}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sessions table */}
      {tab === "sessions" && (
        <SessionsManagement sessions={sessions} loading={loading} />
      )}

      {/* Leaderboard */}
      {tab === "leaderboard" && (
        <div className="card-elevated overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-800">Top Mentors</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-bold text-gray-800 mb-2">No data</h3>
              <p className="text-gray-500">Leaderboard will appear soon</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((u, i) => (
                  <tr key={u._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span
                        className={`w-8 h-8 inline-flex items-center justify-center rounded-full font-bold ${
                          i === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : i === 1
                            ? "bg-gray-100 text-gray-700"
                            : i === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-50 text-gray-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{u.name}</td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">{u.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
