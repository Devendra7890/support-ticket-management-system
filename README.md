# Support Ticket Management System

A full-stack helpdesk app where users create and track support tickets, and admins manage status, priority, and conversations. Built with React, Express, and local MongoDB.

## Features

- User registration and login
- JWT authentication and role-based access (`USER` / `ADMIN`)
- Create and manage support tickets
- Ticket status and priority management
- Comments and activity history
- In-app notifications
- Admin dashboard
- Search, filters, sorting, and pagination

## Tech Stack

**Frontend:** React.js, Vite, JavaScript, Tailwind CSS, React Router, Axios, React Context, React Hot Toast

**Backend:** Node.js, Express.js (ES Modules), JWT, bcryptjs, Zod

**Database:** MongoDB (local), Mongoose

## Project Structure

```text
support-ticket-management/
├── backend/          # Express API
│   ├── scripts/      # Seed and tests
│   └── src/          # Routes, controllers, services, models
├── frontend/         # React + Vite SPA
│   ├── scripts/      # UI contract tests
│   └── src/          # Pages, components, services
├── docs/             # Postman collection
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- MongoDB Community Server (local, port `27017`)

### Clone

```bash
git clone https://github.com/Devendra7890/support-ticket-management-system.git
cd support-ticket-management-system
```

### Install

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Environment

```bash
cd backend
cp .env.example .env

cd ../frontend
cp .env.example .env
```

Edit `backend/.env` and set at least `MONGODB_URI`, `PORT`, and a `JWT_SECRET` (32+ characters).

### Start MongoDB

Keep MongoDB running locally on `27017` (match `MONGODB_URI` in `.env`).

### Seed admin (optional)

```bash
cd backend
npm run seed:admin
```

Requires `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `backend/.env`.

### Run

```bash
# Terminal 1 — API (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — UI (http://localhost:5173)
cd frontend
npm run dev
```

- Health: `http://localhost:5000/api/health`
- App: `http://localhost:5173`

## Environment Variables

**Backend** — copy `backend/.env.example` → `backend/.env`

| Required | Optional / seed |
|----------|-----------------|
| `MONGODB_URI`, `PORT`, `JWT_SECRET` | `NODE_ENV`, `CORS_ORIGIN`, `JWT_EXPIRES_IN`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` |

**Frontend** — copy `frontend/.env.example` → `frontend/.env`

- `VITE_API_BASE_URL` (defaults to `/api`; Vite proxies to the backend)

Never commit real `.env` files or secrets.

## Admin Setup

1. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `backend/.env`.
2. Run `npm run seed:admin` from `backend/`.
3. Log in through the UI or `POST /api/auth/login`.

Public registration always creates `USER` accounts.

## Available Scripts

**Backend** (`backend/`)

```bash
npm run dev
npm start
npm run seed:admin
npm run validate:models
npm run test:auth
npm run test:tickets
npm run test:admin-tickets
npm run test:comments
npm run test:events
npm run test:phase10
npm run test:phase11
npm run test:regression
```

**Frontend** (`frontend/`)

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test:auth-ui
npm run test:user-tickets-ui
```

## API Overview

Base URL: `http://localhost:5000/api`

- `GET /health`
- `/auth` — register, login, current user
- `/tickets` — user tickets, stats, comments, activity
- `/admin` — admin check and ticket management
- `/notifications` — list and mark as read

Postman collection: `docs/Support-Ticket-Management.postman_collection.json`

## Testing

API server and MongoDB must be running for integration tests.

```bash
cd backend
npm run test:regression

cd ../frontend
npm run test:auth-ui
npm run test:user-tickets-ui
npm run build
```

## Repository

https://github.com/Devendra7890/support-ticket-management-system

## Future Deployment

The supported setup uses **local MongoDB**. For production, the same API can use **MongoDB Atlas** by updating `MONGODB_URI` and deploying the backend and frontend behind HTTPS.
