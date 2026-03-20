# SkillSwap Database: Collections and Properties

The database name is **skillswap**. Collections are **created automatically** by Mongoose when the app first saves data (e.g. first user signup creates `users`). You define **properties** (schema) in the model files under `backend/models/`.

---

## How it works

1. **Model file** (e.g. `User.js`) defines the **schema** (field names and types).
2. Mongoose uses the **model name** to create a **collection** in MongoDB (lowercase, plural):
   - `User` → collection **`users`**
   - `Skill` → collection **`skills`**
   - `Session` → collection **`sessions`**
   - `Chat` → collection **`chats`**
3. When the app runs and saves a document (e.g. signup), the collection is created in the **skillswap** database if it doesn’t exist.

You do **not** create collections manually in MongoDB. Edit the model files to change or add properties.

---

## 1. Collection: `users`

**Model file:** `backend/models/User.js`  
**Collection name in MongoDB:** `users`

| Property   | Type     | Required | Default     | Description                    |
|-----------|----------|----------|-------------|--------------------------------|
| name      | String   | Yes      | —           | User's full name               |
| email     | String   | Yes      | —           | Unique, lowercase              |
| password  | String   | Yes      | —           | Min 6 chars, hashed by bcrypt  |
| role      | String   | No       | 'student'   | 'student' or 'admin'            |
| points    | Number   | No       | 0           | Mentor points                  |
| contact   | String   | No       | —           | Phone or other contact         |
| createdAt | Date     | Auto     | —           | Added by `timestamps: true`    |
| updatedAt | Date     | Auto     | —           | Added by `timestamps: true`    |

---

## 2. Collection: `skills`

**Model file:** `backend/models/Skill.js`  
**Collection name in MongoDB:** `skills`

| Property   | Type            | Required | Description                    |
|-----------|------------------|----------|--------------------------------|
| title     | String           | Yes      | Skill name (e.g. "Python")     |
| category  | String           | Yes      | Category (e.g. "Programming") |
| mentorId  | ObjectId (User)  | Yes      | Reference to user who teaches |
| createdAt | Date             | Auto     | From `timestamps: true`       |
| updatedAt | Date             | Auto     | From `timestamps: true`       |

---

## 3. Collection: `sessions`

**Model file:** `backend/models/Session.js`  
**Collection name in MongoDB:** `sessions`

| Property     | Type            | Required | Default   | Description                          |
|-------------|-----------------|----------|-----------|--------------------------------------|
| learnerId   | ObjectId (User) | Yes      | —         | User requesting to learn              |
| mentorId    | ObjectId (User) | Yes      | —         | User teaching                         |
| skillId     | ObjectId (Skill)| Yes      | —         | Skill being taught                    |
| date        | Date            | Yes      | —         | Session date                          |
| timeSlot    | String          | Yes      | —         | e.g. "2:00 PM - 3:00 PM"             |
| teachingMode| String          | Yes      | —         | 'in-person', 'online', 'flexible'    |
| status      | String          | No       | 'pending' | 'pending','accepted','rescheduled','completed' |
| createdAt   | Date            | Auto     | —         | From `timestamps: true`              |
| updatedAt   | Date            | Auto     | —         | From `timestamps: true`              |

---

## 4. Collection: `chats`

**Model file:** `backend/models/Chat.js`  
**Collection name in MongoDB:** `chats`

| Property   | Type             | Required | Description           |
|-----------|------------------|----------|-----------------------|
| sessionId | ObjectId (Session)| Yes      | Session for this chat |
| senderId  | ObjectId (User)   | Yes      | User who sent message |
| message   | String            | Yes      | Message text          |
| createdAt | Date              | Auto     | From `timestamps: true` |
| updatedAt | Date              | Auto     | From `timestamps: true` |

---

## How to add or change properties

1. Open the right model file in `backend/models/` (e.g. `User.js`).
2. Edit the schema. Examples:

   **Add a new field (e.g. `phone` to User):**
   ```js
   const userSchema = new mongoose.Schema({
     name: { type: String, required: true, trim: true },
     email: { type: String, required: true, unique: true, lowercase: true },
     password: { type: String, required: true, minlength: 6 },
     role: { type: String, enum: ['student', 'admin'], default: 'student' },
     points: { type: Number, default: 0 },
     contact: { type: String, trim: true },
     phone: { type: String, trim: true },   // new property
   }, { timestamps: true });
   ```

   **Make a field optional:** use `required: false` or omit `required`.

   **Change type:** e.g. `type: Number` instead of `type: String`.

3. Save the file and restart the backend (`npm run dev` or `node server.js`).
4. New documents will use the new schema. Existing documents in MongoDB will not get the new field until you update them (or you can set `default` in the schema).

---

## Summary

| Collection (MongoDB) | Model file        | Defines properties in code        |
|----------------------|-------------------|-----------------------------------|
| users                | `models/User.js`  | name, email, password, role, points, contact |
| skills               | `models/Skill.js` | title, category, mentorId         |
| sessions             | `models/Session.js` | learnerId, mentorId, skillId, date, timeSlot, teachingMode, status |
| chats                | `models/Chat.js`  | sessionId, senderId, message      |

Collections are created in the **skillswap** database when the app first writes data; you define their properties by editing these model files.
