# CodeDev Network — Agent Rules & System Architecture Reference

This document serves as the single source of truth for AI coding agents (`Antigravity`, `Gemini`, or others) working in this workspace. Refer to this file to understand the architecture, codebase layout, data models, core workflows, and guidelines **before** making changes. Do not read the entire codebase recursively; refer to this map first.

---

## 🚀 System Overview

**CodeDev Network** is a unified competitive programming platform that:
1. Aggregates and syncs external profiles (LeetCode, Codeforces, GFG, CodeChef) to calculate a global leaderboard.
2. Hosts in-house coding contests with real-time asynchronous code execution and scoring.
3. Provides an admin panel for problem and contest management.
4. Allows sharing and managing interview experiences.

### Technical Stack
* **Frontend:** React 19, Vite 7, React Router DOM v7, Material UI (MUI) v7, Tailwind CSS v4, Monaco Editor (in-browser IDE), Socket.IO-client.
* **Backend:** Node.js, Express 5, MongoDB (Mongoose), Redis, BullMQ (background queue processing).
* **Code Execution:** Judge0 CE (supports sandbox execution of C++ and Java).
* **Real-time Engine:** Socket.IO for pushing compile/run verdicts down to client rooms.

---

## 📁 Repository Layout

```
CodeDev_Network/
│
├── frontend/                   # React user-facing application
│   └── src/
│       ├── Pages/              # Page layouts (Auth, Contest, Interview, LeaderBoard, Problems, Profile)
│       ├── components/         # Reusable widgets (CodeEditor, Navbar, Spinner)
│       ├── api/                # Axios instance and API call functions
│       └── context/            # Global React states (e.g., AuthContext)
│
├── admin/                      # React + Vite admin dashboard (accessible at /admin)
│
└── backend/                    # Express.js REST API Server
    ├── config/                 # DB connections, WS setups, language mapping config
    ├── middleware/             # auth.middleware.js, admin.middleware.js
    ├── models/                 # Mongoose schemas (User, Problem, Contest, Submission, etc.)
    ├── routes/                 # Express Router mappings
    ├── controllers/            # Route business logic handlers
    ├── services/               # Background helper scripts (leaderboard calculation, scraping)
    └── workers/                # BullMQ queue definitions and execution workers
```

---

## 💾 Core Mongoose Models

Use the links to inspect the current schemas:
1. **[`User.js`](file:///c:/Users/msi/Programming/CodeDev_Network/backend/models/User.js):**
   * Stores user credentials (password is hidden by default: `select: false`), role (`user`, `admin`), branch, graduation year, and platform usernames.
2. **[`Problem.js`](file:///c:/Users/msi/Programming/CodeDev_Network/backend/models/Problem.js):**
   * Stores problem descriptions, constraints, difficulty, and an array of `testCases` (`input`, `output`, `isSample`).
3. **[`Contest.js`](file:///c:/Users/msi/Programming/CodeDev_Network/backend/models/Contest.js):**
   * Stores metadata, state (`upcoming`, `running`, `ended`), start/end times, participant array (list of user IDs), and problem list with associated point weightings.
4. **[`ContestSubmission.js`](file:///c:/Users/msi/Programming/CodeDev_Network/backend/models/ContestSubmission.js):**
   * Records code submissions sent during active contests. Tracks problem, user, contest, verdict (`AC`, `WA`, `TLE`, etc.), execution time, and points scored.
5. **[`Submission.js`](file:///c:/Users/msi/Programming/CodeDev_Network/backend/models/Submission.js):**
   * Records submissions for independent problem practice (not associated with a contest).
6. **[`ExternalStats.js`](file:///c:/Users/msi/Programming/CodeDev_Network/backend/models/ExternalStats.js):**
   * Stores synced counts of solved problems from LeetCode, Codeforces, GeeksforGeeks, and CodeChef.
7. **[`InterviewExperience.js`](file:///c:/Users/msi/Programming/CodeDev_Network/backend/models/InterviewExperience.js):**
   * Stores student sharing records about interviews. Subschemas trace company name, role, details of rounds, and recruitment status (outcome values: `cleared`, `rejected`, `waiting`).
8. **[`Scoreboard.js`](file:///c:/Users/msi/Programming/CodeDev_Network/backend/models/Scoreboard.js):**
   * **Note:** Currently unused for leaderboards. Intended to cache/pre-compute contest standings with per-problem score, attempts, and penalty markers.

---

## ⚙️ Key Workflows

### 1. Code Judging & WebSockets
* When a user submits code (normal or contest), the controller:
  1. Validates the submission parameters.
  2. Enqueues a BullMQ job named `runSubmission` in `submissionQueue` via [`bullMQ.queue.js`](file:///c:/Users/msi/Programming/CodeDev_Network/backend/services/bullMQ.queue.js).
  3. Returns a `202 Accepted` response with the job ID immediately.
* **Worker Execution ([`submission.worker.js`](file:///c:/Users/msi/Programming/CodeDev_Network/backend/workers/submission.worker.js)):**
  1. Pulls the job and queries the problem details (including test cases).
  2. Sends code to **Judge0 CE** server case-by-case.
  3. Compares actual stdout against expected output (with whitespace normalization).
  4. Saves the results to MongoDB (`Submission` or `ContestSubmission`).
  5. Triggers a completion socket event (`submission:result` or `contestSubmission:result`) targeting the room `room:<userId>` so the frontend updates the UI in real time.

### 2. External Sync & Global Leaderboard
* Users click "Sync" in their profiles to fetch up-to-date solve numbers from Codeforces, LeetCode, GFG, and CodeChef.
* The task is offloaded to the background via [`sync.worker.js`](file:///c:/Users/msi/Programming/CodeDev_Network/backend/workers/sync.worker.js):
  1. Scrapes profiles or hits official GraphQL/REST APIs asynchronously.
  2. Invokes [`scoreCalculator.js`](file:///c:/Users/msi/Programming/CodeDev_Network/backend/services/leaderboard/scoreCalculator.js) to compute weight-based global ranking scores.
  3. Updates the `ExternalStats` record for the user.

### 3. Contest Leaderboard
* Fetching the contest leaderboard via `GET /api/contest/:slug/leaderboard` computes standings **on-the-fly** inside [`contest.controller.js`](file:///c:/Users/msi/Programming/CodeDev_Network/backend/controllers/contest.controller.js#L440).
* It aggregates all `ContestSubmission` records matching the contest, sums up points for solved problems, and sorts users in descending order.

---

## 🛠 Guidelines for AI Developers

1. **Keep REST APIs Stateless:** Authenticate users using the JWT verification middleware [`auth.middleware.js`](file:///c:/Users/msi/Programming/CodeDev_Network/backend/middleware/auth.middleware.js).
2. **Never Blocks API Threads:** Heavy computations or external API/scraping requests must go through BullMQ background queues (`submissionQueue` or `syncQueue`).
3. **Index Optimization:** Do not write contest ranking systems that perform full collection scans. If you switch to pre-computed scoreboards, leverage the index on `ScoreboardSchema` (`{ contestId: 1, totalScore: -1, totalPenalty: 1 }`).
4. **Clean Passwords:** Ensure password hashes are never returned in MongoDB read responses (make sure password selection stays disabled).
5. **No Double Points:** When editing scoring logic, ensure a user doesn't get points twice for submitting a correct solution to a problem multiple times in a contest.

---

## 📝 Change Log

| Date | Agent / Action | Affected Components / Files | Description |
| :--- | :--- | :--- | :--- |
| 2026-08-21 | Antigravity AI (Initial) | Workspace Root ([`AGENTS.md`](file:///c:/Users/msi/Programming/CodeDev_Network/AGENTS.md)) | Created this architecture reference file to track system schemas, flows, and guidelines. |
| 2026-09-19 | Antigravity AI | Backend Models & Controllers | Added MongoDB indexes, query projections, lean queries, and pagination for Leaderboard and Interview Experience APIs. |
| 2026-09-19 | Antigravity AI | Backend Services & App | Added resilient dual-layer caching (Redis with in-memory TTL fallback), cache invalidation, and HTTP response compression. |
