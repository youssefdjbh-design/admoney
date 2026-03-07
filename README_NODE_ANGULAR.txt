AdMoney - Node.js + Angular

This repository now includes a full Node.js backend and Angular frontend.

Structure:
- server/: Express API with PostgreSQL, JWT cookies, rate limiting
- frontend/: Angular app (standalone components)

Local run:
1) Install Node.js LTS (includes npm).
2) In repo root:
   npm install
   npm run install:all
3) Start backend:
   npm run dev:server
4) In another terminal start frontend:
   npm run dev:frontend
5) Open http://localhost:4200

Env variables for backend (server/.env):
- PORT=5000
- DATABASE_URL=postgresql://...
- JWT_SECRET_KEY=...
- FRONTEND_URL=http://localhost:4200

Implemented API routes:
- POST /api/auth/signup
- POST /api/auth/login (1 request / 5 sec)
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/dashboard
- POST /api/view-ad (1 request / 5 sec + 10s wait logic)
- GET /api/health
