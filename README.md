# CodeDev Network 🚀

A unified competitive programming platform that aggregates coding profiles across major platforms, computes unified rankings, hosts in-house coding contests with real-time judging, and enables in-browser code execution — all in one place.

---

## 🔥 Features

### 🔗 Profile Aggregation
- **LeetCode** — via GraphQL API
- **Codeforces** — via Official REST API
- **GeeksforGeeks** — via web scraping (Playwright / Puppeteer)
- **CodeChef** — via web scraping (Cheerio / Playwright)
- On-demand sync triggered by the user; runs asynchronously via a **BullMQ background worker queue** backed by **Redis**

### 🏆 Unified Ranking & Leaderboard
- Per-platform rankings (LeetCode, Codeforces, GFG, CodeChef)
- Global aggregate ranking with weighted scoring
- University-specific leaderboard (Jamia Millia Islamia)

### 🏅 Contest System *(Fully Implemented)*
- Create & manage contests (admin only)
- Contest lifecycle states: `upcoming → running → ended`
- Join / leave a contest
- View contest problems (only when contest is running and user is registered)
- **Contest submission pipeline** — submissions are judged asynchronously via Judge0 CE and results delivered via **WebSockets (Socket.IO)**
- Per-problem **scoring** and **penalty** tracking
- **Scoreboard / Contest Leaderboard** — ranked by total score and total penalty
- Full submission history per problem per user within a contest

### 👨‍💻 Code Execution & Judging
- **Monaco Editor** — VS Code-grade in-browser code editor
- **Judge0 CE** — multi-language code execution (C++, Java)
- Supports: full submission, run-on-sample-tests mode, and contest submission
- Per-problem time limit and memory limit enforcement
- Verdicts: `AC`, `WA`, `TLE`, `RE`, `CE`, `MLE`
- **Real-time results** delivered over **WebSockets** (no polling)
- BullMQ **submission worker** processes all judging asynchronously

### 📝 Problems
- Problem listing with difficulty and tags
- Individual problem page with statement, constraints, and sample test cases
- Submission history per problem per user
- Protected — requires login

### 🔐 Authentication
- User registration & login
- **bcryptjs** password hashing
- **JWT**-based stateless authentication
- Protected routes on both frontend and backend
- Admin-only middleware for privileged operations

### 🛠 Admin Panel
- Separate React + Vite admin dashboard (`/admin`)
- Manage problems, contests, users, and platform data

### 🌐 Deployment
- Dockerized backend (Node.js + headless Chrome for scraping)
- Backend deployed on **Render**
- Frontend & Admin built with **Vite** (deployable on Vercel / Netlify / Render)

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 7 | Build tool & dev server |
| React Router DOM v7 | Client-side routing |
| MUI (Material UI) v7 | UI component library |
| Tailwind CSS v4 | Utility-first styling |
| Monaco Editor | In-browser code editor |
| Socket.IO Client | Real-time WebSocket communication |
| Axios | HTTP client |
| React Toastify | Notifications |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | API server |
| MongoDB + Mongoose | Database & ODM |
| BullMQ + Redis | Background job queue (sync & submissions) |
| Judge0 CE | Code execution engine |
| Socket.IO | Real-time result delivery |
| Playwright / Puppeteer | Web scraping (GFG, CodeChef) |
| Cheerio | HTML parsing |
| JWT + bcryptjs | Authentication |
| Docker | Containerization |

---

## 📁 Project Structure

```
CodeDev_Network/
│
├── frontend/                   # React + Vite user-facing app
│   └── src/
│       ├── Pages/
│       │   ├── Auth/           # Login & Registration
│       │   ├── Contest/        # Contest listing, detail, leaderboard
│       │   ├── Discuss/        # Community discussions (planned)
│       │   ├── Home/           # Landing / Dashboard
│       │   ├── LeaderBoard/    # Global & per-platform rankings
│       │   ├── Learn/          # Learning resources (planned)
│       │   ├── Problems/       # Problem set, problem detail & submission
│       │   └── Profile/        # User profile page
│       ├── components/
│       │   ├── CodeEditor/     # Monaco Editor wrapper
│       │   ├── Footer/
│       │   ├── Navbar/
│       │   └── Spinner/
│       ├── api/                # Axios API layer
│       ├── context/            # React context (AuthContext)
│       └── hooks/              # Custom React hooks
│
├── backend/                    # Node.js + Express API server
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── contest.routes.js
│   │   ├── leaderboard.routes.js
│   │   ├── problem.routes.js
│   │   ├── profile.routes.js
│   │   ├── submission.routes.js
│   │   ├── sync.routes.js
│   │   └── admin.routes.js
│   ├── controllers/            # Route handler logic
│   ├── services/
│   │   ├── leaderboard/        # Ranking computation engine
│   │   └── platformSync/       # LeetCode, Codeforces, GFG, CodeChef scrapers
│   ├── models/
│   │   ├── User.js
│   │   ├── Problem.js
│   │   ├── Submission.js
│   │   ├── Contest.js
│   │   ├── ContestSubmission.js
│   │   ├── Scoreboard.js
│   │   └── ExternalStats.js
│   ├── workers/
│   │   ├── sync.worker.js      # Background profile sync worker
│   │   ├── sync.queue.js       # BullMQ sync queue
│   │   └── submission.worker.js # Async code judging worker
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── admin.middleware.js
│   ├── config/                 # DB, Judge0 URL, language map, Socket.IO
│   ├── utils/                  # Helper utilities
│   └── Dockerfile
│
└── admin/                      # React + Vite admin dashboard
```

---

## 🧠 System Design

### Submission Pipeline (Real-Time Judging)
```
User submits code
      │
      ▼
REST API → enqueues job in BullMQ (submissionQueue) → returns 202 Accepted
      │
      ▼
submission.worker.js
  ├── Fetches problem test cases from MongoDB
  ├── Calls Judge0 CE for each test case (series)
  ├── Computes verdict: AC / WA / TLE / RE / CE / MLE
  ├── Saves Submission / ContestSubmission to MongoDB
  └── Emits result via Socket.IO → user's room
      │
      ▼
Frontend receives "submission:result" / "contestSubmission:result"
and renders verdict in real time
```

### Profile Sync Pipeline
```
User triggers sync → POST /api/sync
      │
      ▼
sync.worker.js (BullMQ)
  ├── LeetCode   → GraphQL API
  ├── Codeforces → REST API
  ├── GFG        → Playwright scraper
  └── CodeChef   → Playwright / Cheerio scraper
      │
      ▼
ExternalStats model updated in MongoDB
      │
      ▼
Leaderboard service recomputes weighted rankings
```

### Architecture Highlights
- **Stateless REST API** — JWT auth, no server-side sessions
- **Worker-based ingestion** — all heavy work runs off the request thread
- **Real-time WebSockets** — Socket.IO with per-user rooms (`room:<userId>`)
- **Decoupled frontend & backend** — frontend talks to backend via a typed Axios API layer

---

## 📊 Leaderboard & Ranking Logic

- Weighted scores assigned per platform
- Aggregated scores generate:
  - Per-platform rankings
  - Global rankings
  - University-specific leaderboards (Jamia Millia Islamia)

---

## 🌐 API Routes

| Method | Endpoint | Description | Auth |
|--------|---|---|---|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Login & receive JWT | Public |
| GET | `/api/leaderboard` | Global + per-platform leaderboard | Public |
| GET | `/api/getProfile/:username` | User profile & external stats | Auth |
| POST | `/api/sync` | Trigger profile sync | Auth |
| GET | `/api/problems` | List all problems | Auth |
| GET | `/api/problems/:slug` | Problem detail | Auth |
| POST | `/api/submissions` | Submit code | Auth |
| GET | `/api/submissions` | Submission history | Auth |
| GET | `/api/contest` | List all contests | Auth |
| GET | `/api/contest/:slug` | Contest details | Auth |
| POST | `/api/contest/:slug/join` | Join a contest | Auth |
| POST | `/api/contest/:slug/leave` | Leave a contest | Auth |
| GET | `/api/contest/:slug/problems` | Contest problems (if running & joined) | Auth |
| POST | `/api/contest/:slug/submit` | Submit code for contest | Auth |
| GET | `/api/contest/:slug/leaderboard` | Contest scoreboard | Auth |
| POST | `/api/contest/create` | Create a contest | Admin |
| PUT | `/api/contest/:id` | Update a contest | Admin |
| DELETE | `/api/contest/:id` | Delete a contest | Admin |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- Redis (local or cloud — required for BullMQ)
- Judge0 CE (self-hosted or cloud)

### Backend
```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, REDIS_HOST, JUDGE0_URL
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Admin Panel
```bash
cd admin
npm install
npm run dev
```

### Docker (Backend)
```bash
cd backend
docker build -t codedev-backend .
docker run -p 5000:5000 --env-file .env.docker codedev-backend
```

---

## ⚠️ Current Status

| Feature | Status |
|---|---|
| Profile aggregation (LeetCode, Codeforces, GFG, CodeChef) | ✅ Working |
| Background sync via BullMQ + Redis | ✅ Working |
| Unified leaderboard & weighted ranking system | ✅ Working |
| Authentication (register / login / JWT) | ✅ Working |
| Problem listing & problem detail page | ✅ Working |
| Code submission & run-on-samples | ✅ Working |
| Real-time verdict delivery via Socket.IO | ✅ Working |
| In-browser Monaco Editor (C++, Java) | ✅ Working |
| Contest listing, details & registration | ✅ Working |
| Contest submission & per-problem scoring | ✅ Working |
| Contest scoreboard / leaderboard | ✅ Working |
| Admin panel | ✅ Working |
| Discussion forum | 🔜 Planned |
| Learn section | 🔜 Planned |
| Judge0 cloud deployment | ⏳ Pending |
| Notifications & contest reminders | 🔜 Planned |

---

## 📌 Future Improvements

- Deploy Judge0 CE on cloud for production code execution
- Expand supported languages beyond C++ and Java
- Build out the Discussion forum with threading & voting
- Add a Learning section with curated resources
- Analytics dashboard for user progress
- Contest notifications and reminders
- Improve ranking algorithm with more platforms

---

## 👤 Author

**Mohd Mudassir Khan**

- GitHub: [Mudassar123khan](https://github.com/Mudassar123khan)
- LinkedIn: [mohdmudassirkhan](https://www.linkedin.com/in/mohdmudassirkhan/)

---

## ⭐ Show Your Support

If you find this project useful, give it a ⭐ on GitHub!