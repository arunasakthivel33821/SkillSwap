# SkillSwap Campus – Peer-to-Peer Learning & Micro-Mentorship Platform

A university-focused peer-to-peer learning platform where students teach and learn skills from each other. Faculty act as admins to monitor activity. Teaching is coordinated via the platform but conducted outside (in-person, Google Meet, WhatsApp, etc.).

## Tech Stack

- **Frontend:** React (functional components), Vite, Tailwind CSS, Dark Green & White theme
- **Backend:** Node.js, Express.js, JWT auth, REST APIs
- **Database:** MongoDB with Mongoose
- **Chat:** Database-based (no Socket.IO)

## User Roles

- **Student:** Can teach skills (mentor), learn skills (learner), request sessions, chat after acceptance, earn points for mentoring
- **Admin (Faculty):** Monitor users, skills, sessions, leaderboard. No teaching/learning role.

## Features

- **Auth:** Student/Admin signup & login, JWT, role-based access
- **Student:** Dashboard (name, points), skill profile (add/edit/delete skills), browse skills, request sessions (date, time, teaching mode), session status (pending/accepted/rescheduled/completed), points for mentors on completion
- **Chat:** One-to-one after session acceptance, text-only
- **Admin:** Dashboard stats, view students/skills/sessions, leaderboard

## Project Structure

```
skillswapcampus-cursor/
├── backend/          # Node.js + Express API
│   ├── models/       # User, Skill, Session, Chat
│   ├── routes/       # auth, skills, sessions, chat, admin, leaderboard
│   ├── middleware/   # auth, adminOnly
│   └── server.js
├── frontend/         # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── api.js
│   │   └── App.jsx
│   └── ...
└── README.md
```

## Local Development

### Backend

1. Create `backend/.env` from `backend/.env.example`:
   - `MONGO_URI` – MongoDB connection string (e.g. MongoDB Atlas)
   - `JWT_SECRET` – secret for JWT signing
   - `PORT` (optional, default 5000)

2. Install and run:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Server runs at `http://localhost:5000`.

### Frontend

1. Optional: create `frontend/.env` with `VITE_API_URL=http://localhost:5000` if not using Vite proxy.

2. Install and run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   App runs at `http://localhost:3000`. Vite proxy forwards `/api` to the backend when `VITE_API_URL` is unset.

## Deployment

### Frontend (Vercel)

1. Push the repo to GitHub.
2. In Vercel, import the project and set **Root Directory** to `frontend`.
3. Add environment variable: `VITE_API_URL` = your Render backend URL (e.g. `https://skillswap-api.onrender.com`).
4. Deploy. Vercel will run `npm run build` and serve the `dist` folder.

### Backend (Render)

1. Create a **Web Service** on Render.
2. Connect the same GitHub repo and set **Root Directory** to `backend`.
3. Build: `npm install`, Start: `npm start`.
4. Environment variables:
   - `MONGO_URI` – MongoDB Atlas connection string
   - `JWT_SECRET` – strong random secret
   - `NODE_ENV` – `production`
5. Enable CORS for your Vercel frontend origin (backend uses `cors({ origin: true })` which allows any; restrict in production if needed).

### MongoDB Atlas

1. Create a cluster and get the connection string.
2. Use it as `MONGO_URI` in the backend (local and Render).

## API Overview

- `POST /api/auth/signup` – signup
- `POST /api/auth/login` – login
- `GET /api/auth/me` – current user (auth)
- `GET/POST/PATCH/DELETE /api/skills` – skills (auth)
- `GET /api/skills/my` – my skills (student)
- `GET/POST /api/sessions/my`, `PATCH /api/sessions/:id` – sessions (auth)
- `GET/POST /api/chat/session/:id`, `POST /api/chat` – chat (auth, after session accepted)
- `GET /api/leaderboard` – leaderboard (auth)
- `GET /api/admin/*` – admin-only (stats, students, skills, sessions, leaderboard)

## Note

Teaching happens outside the platform using mutually agreed methods (in-person, Google Meet, Zoom, WhatsApp, etc.). The platform is for coordination, scheduling, communication, and tracking only.
