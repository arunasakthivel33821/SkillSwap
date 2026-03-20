# How to Connect SkillSwap Campus to MongoDB

The app uses **MongoDB** for all data (users, skills, sessions, chat). You can use either **local MongoDB** or **MongoDB Atlas** (cloud).

---

## Option 1: MongoDB Atlas (Cloud – recommended, free tier)

1. **Create an account**
   - Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up (free).

2. **Create a cluster**
   - Click **Build a Database** → choose **M0 FREE** → Create.
   - Pick a cloud provider and region (e.g. AWS, closest to you).
   - Cluster name can stay default (e.g. `Cluster0`).

3. **Create a database user**
   - Security → **Database Access** → **Add New Database User**.
   - Choose **Password** auth, set a **username** and **password** (save them).
   - Database User Privileges: **Atlas admin** or **Read and write to any database**.
   - Create User.

4. **Allow network access**
   - Security → **Network Access** → **Add IP Address**.
   - For development: **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Confirm.

5. **Get the connection string**
   - **Database** → **Connect** → **Connect your application**.
   - Copy the URI. It looks like:
     ```
     mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `USERNAME` and `PASSWORD` with your database user.
   - Add the database name before `?`:
     ```
     mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/skillswap?retryWrites=true&w=majority
     ```
   - If the password has special characters (e.g. `#`, `@`), encode them (e.g. `#` → `%23`).

6. **Put it in the backend**
   - Open `backend/.env`.
   - Set:
     ```
     MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/skillswap?retryWrites=true&w=majority
     ```
   - Save the file.

7. **Start the backend**
   - From project root: `cd backend` then `npm run dev` (or `node server.js`).
   - If you see `Server running on port 5000`, MongoDB is connected.

---

## Option 2: Local MongoDB (on your computer)

1. **Install MongoDB**
   - Windows: [MongoDB Community Server](https://www.mongodb.com/try/download/community) – run the installer, optionally install as a service.
   - Mac: `brew install mongodb-community` then `brew services start mongodb-community`.
   - Or use [MongoDB Compass](https://www.mongodb.com/products/compass) (includes a way to run MongoDB).

2. **Start MongoDB**
   - Make sure the MongoDB service is running (e.g. from Services on Windows, or `brew services start mongodb-community` on Mac).

3. **Use default connection (no .env change needed)**
   - The app already uses `mongodb://localhost:27017/skillswap` when `MONGO_URI` is not set.
   - So you can leave `MONGO_URI` out of `backend/.env`, or set:
     ```
     MONGO_URI=mongodb://localhost:27017/skillswap
     ```

4. **Start the backend**
   - `cd backend` then `npm run dev`.
   - You should see `Server running on port 5000` and no MongoDB connection error.

---

## Where the app reads the connection

- File: `backend/server.js`
- Line: `mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skillswap')`
- So:
  - If `MONGO_URI` is set in `backend/.env` → that URL is used.
  - If not → `mongodb://localhost:27017/skillswap` is used.

---

## Troubleshooting

| Problem | What to do |
|--------|------------|
| "MongoDB connection error" | Check MONGO_URI in `backend/.env`, username/password, and that MongoDB (local or Atlas) is running / reachable. |
| Atlas: "IP not allowed" | In Atlas → Network Access → add your IP or `0.0.0.0/0` for testing. |
| Password has `#` or `@` | Encode in the URI (e.g. `#` → `%23`, `@` → `%40`). |
| Local: "connect ECONNREFUSED" | Start MongoDB (e.g. Windows Services, or `brew services start mongodb-community`). |

---

## Summary

1. Get a MongoDB URI (Atlas or local).
2. Put it in **`backend/.env`** as **`MONGO_URI=...`**.
3. Run the backend; when it starts without a DB error, you’re connected.
