# EventHub — College Event Management Platform

**EventHub** is a full-stack college event management platform built from scratch using the MERN stack (**MongoDB Atlas**, **Express.js**, **React.js + Vite**, **Node.js**).

Currently completed:
- **Phase 0 – Project Setup:** Project structure, Student Panel layout, Axios + React Router configuration, MongoDB Atlas connection, centralized error handling, and health-check API.
- **Phase 1 – Authentication & Role Management:** JWT + `bcrypt` authentication (`register`, `login`, `me`, `logout`), role-based access control (`student` and `admin`), protected frontend routes, persistent login sessions, Login/Signup UI, and role-isolated Student & Admin dashboards.

---

## Tech Stack

- **Frontend:** React 18 + Vite, React Router DOM, Axios, Lucide React
- **Backend:** Node.js, Express.js, Mongoose, dotenv, cors, `bcrypt`, `jsonwebtoken`
- **Database:** MongoDB Atlas

---

## Folder Structure

```text
EventHub/
├── .gitignore
├── README.md
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tests/
│   │   └── auth.test.js
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   ├── db.js
│       │   └── env.js
│       ├── controllers/
│       │   ├── authController.js
│       │   └── healthController.js
│       ├── middleware/
│       │   ├── authMiddleware.js
│       │   ├── errorHandler.js
│       │   └── roleMiddleware.js
│       ├── models/
│       │   ├── .gitkeep
│       │   └── User.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── dashboardRoutes.js
│       │   ├── healthRoutes.js
│       │   └── index.js
│       ├── scripts/
│       │   └── seedAdmin.js
│       └── services/
│           ├── authService.js
│           └── healthService.js
└── frontend/
    ├── .env
    ├── .env.example
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── components/
        │   ├── auth/
        │   │   ├── ProtectedRoute.jsx
        │   │   └── PublicOnlyRoute.jsx
        │   ├── common/
        │   │   ├── ComingSoonCard.jsx
        │   │   ├── PageHeader.jsx
        │   │   ├── StatCard.jsx
        │   │   └── SystemStatusCard.jsx
        │   └── layout/
        │       ├── DashboardLayout.jsx
        │       ├── Sidebar.jsx
        │       └── Topbar.jsx
        ├── config/
        │   └── navigation.js
        ├── context/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── AttendancePage.jsx
        │   ├── DashboardPage.jsx
        │   ├── EventsPage.jsx
        │   ├── MyPassesPage.jsx
        │   ├── MyProfilePage.jsx
        │   ├── MyTeamPage.jsx
        │   ├── NotFoundPage.jsx
        │   ├── RegistrationsPage.jsx
        │   ├── UnauthorizedPage.jsx
        │   ├── admin/
        │   │   └── AdminDashboardPage.jsx
        │   └── auth/
        │       ├── LoginPage.jsx
        │       └── SignupPage.jsx
        └── services/
            ├── apiClient.js
            ├── authService.js
            └── healthService.js
```

---

## Environment Variables

### Backend (`backend/.env`)

Update `backend/.env` (template in `backend/.env.example`) with your real MongoDB Atlas URI and strong secrets:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/eventhub?retryWrites=true&w=majority&appName=EventHub
JWT_SECRET=replace_with_a_long_random_jwt_secret
JWT_EXPIRES_IN=7d
ADMIN_SETUP_KEY=replace_with_a_secure_admin_setup_key
```

> **Security Note:** Never commit `.env` files or real credentials to Git. `.env` is excluded via `.gitignore`.

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Setup & Running Locally

### 1. MongoDB Atlas Setup

1. Create or open your cluster in [MongoDB Atlas](https://cloud.mongodb.com/).
2. Under **Database Access**, ensure a database user exists with Read/Write permissions.
3. Under **Network Access**, allow your development IP address (or `0.0.0.0/0` for testing).
4. Copy your SRV connection string (`mongodb+srv://<username>:<password>@<cluster-host>/eventhub?retryWrites=true&w=majority`) and place it in `backend/.env` under `MONGODB_URI`.
   - Note: `backend/src/config/db.js` explicitly connects to the `eventhub` database and validates `MONGODB_URI` before starting Express, so the server will exit cleanly with a clear message if `MONGODB_URI` is missing or malformed instead of hanging requests.

### 2. Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Create the First Admin Account (Two Secure Options)

Public registration always assigns the `student` role unless a valid server `ADMIN_SETUP_KEY` is provided. To create your initial admin account securely:

**Option A: Seed Script (Recommended)**
Make sure `MONGODB_URI` is configured in `backend/.env`, then run inside `backend/`:
```bash
npm run seed:admin
```
This creates an admin account with default development credentials (override via `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` env vars):
- **Email:** `admin@eventhub.edu`
- **Password:** `Admin@1234`

**Option B: Signup Page with Setup Key**
1. Open `/signup` in the browser.
2. Select **Admin (Requires Setup Key)** in the **Account Role** dropdown.
3. Enter the `ADMIN_SETUP_KEY` configured in `backend/.env`.

### 4. Run Backend & Frontend Separately

**Terminal 1 — Backend (port `5000`):**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (port `5173`):**
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`. Unauthenticated users are directed to `/login`.

---

## API Endpoints (Phase 0 & Phase 1)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | API & MongoDB connection health status |
| `POST` | `/api/auth/register` | Public | Register a new student (or verified admin with setup key) |
| `POST` | `/api/auth/login` | Public | Authenticate user and return signed JWT |
| `GET` | `/api/auth/me` | Protected (JWT) | Fetch current authenticated user profile |
| `POST` | `/api/auth/logout` | Protected (JWT) | Acknowledge user logout |
| `GET` | `/api/student/dashboard` | Protected (`student`) | Role-protected Student Dashboard check |
| `GET` | `/api/admin/dashboard` | Protected (`admin`) | Role-protected Admin Dashboard check |

---

## Running Backend Integration Tests

```bash
cd backend
npm test
```
