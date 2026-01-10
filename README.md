# CodeDevNetwork

**CodeDevNetwork** is a **college-centric competitive programming and coding platform** designed to centralize coding practice, contests, and performance tracking in one place.  
The platform aggregates users’ problem-solving data from multiple competitive programming platforms, computes a **unified score**, and generates **global as well as platform-wise leaderboards**.

The long-term vision of CodeDevNetwork is to evolve into a **full-fledged coding ecosystem** with its own online judge, contests, analytics, and community features — tailored specifically for college-level competitive programming.

---

## Project Objectives

- Provide a **single unified profile** for a user’s competitive programming journey
- Remove platform fragmentation by aggregating stats from multiple CP platforms
- Enable **fair, weighted ranking** across different platforms
- Offer **college-level contests** and practice problems
- Build a scalable backend suitable for an online judge system

---

## Tools & Technologies

### Currently Used

#### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge)

#### Authentication & Security
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![bcrypt](https://img.shields.io/badge/bcrypt-003A8F?style=for-the-badge)

#### External Platform Integration
![Codeforces](https://img.shields.io/badge/Codeforces-1F8ACB?style=for-the-badge)
![LeetCode](https://img.shields.io/badge/LeetCode-FFA116?style=for-the-badge)
![CodeChef](https://img.shields.io/badge/CodeChef-5B4638?style=for-the-badge)

#### Development Tools
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

---

### Planned / Future Technologies

- **React.js** – Frontend dashboard
- **Docker** – Secure, isolated code execution for judge
- **Redis** – Caching leaderboard & stats
- **BullMQ / Cron Jobs** – Scheduled stats synchronization
- **WebSockets** – Live contest updates
- **Nginx** – Reverse proxy & load balancing
- **Cloud Deployment** – AWS / Render / Railway
- **Plagiarism Detection Tools** – Code similarity checks

---

## Core Features

### Authentication & Authorization
- JWT-based authentication system
- Secure password hashing using bcrypt
- Role-based access control:
  - **User**
  - **Admin**
- Protected routes via middleware

---

### User Profile System
- Unique user accounts
- Linking of competitive programming handles:
  - Codeforces
  - LeetCode
  - CodeChef
- Centralized performance dashboard
- Auto-updated statistics via sync services

---

### External Platform Stats Synchronization
- Dedicated sync services per platform:

- Fetches:
- Total problems solved
- Platform-specific scores/ratings
- Contest participation data
- Normalizes external data into a common schema
- Prevents unnecessary API calls using controlled sync logic

---

### ExternalStats & Aggregation Engine
- Central `ExternalStats` collection per user
- Stores:
- `totalSolved`
- `platformWiseSolved`
- `totalScore`
- `platformWiseScore`
- Indexed fields for high-performance queries
- Acts as the **single source of truth** for leaderboards

---

### Scoring & Ranking System
- Custom **weighted scoring algorithm**
- Platform-specific weights & multipliers
- Config-driven score calculation
- Dynamic rank computation
- Supports:
- Global ranking
- Platform-wise ranking

---

### Leaderboard System
- Sorted by total score
- Platform-filtered leaderboards
- Rank calculated dynamically using MongoDB queries
- Optimized with indexing
- Pagination-ready design

---

### Problem Management System
- Admin-only problem creation
- Fields include:
- Title
- Unique slug
- Difficulty (`Easy | Medium | Hard`)
- Constraints
- Test cases
- Problems reusable across contests
- Order-based problem arrangement

---

### Contest Management System
- Contest schema with:
- Title
- Slug
- Start & end time
- Ordered list of problems
- Supports:
- Upcoming contests
- Live contests
- Future-ready for:
- Submission-based ranking
- Penalty & time tracking

---

### Online Judge (Planned)
- Docker-based execution environment
- Multi-language support
- Secure sandboxed execution
- Time & memory limits
- Judge service isolated from main API
- Scalable microservice-style design

---

## Setup Instructions

```bash
git clone https://github.com/your-username/CodeDevNetwork.git
cd CodeDevNetwork
npm install
npm run dev
```
## .env setup

```bash
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

## License
MIT License


## Author

**Mohd Mudassir Khan**
B.Tech Computer Engineering
Backend Development • Competitive Programming • Scalable Systems