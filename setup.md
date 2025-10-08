# Setup Instructions for Payroll Management System

## Default (SQLite) Setup

### 1) Install dependencies
```bash
npm install
cd client && npm install && cd ..
```

### 2) Environment (optional)
SQLite mode works without `.env`. Defaults:
- PORT=5000
- CLIENT_URL=http://localhost:3000
- JWT_SECRET=your-secret-key-change-in-production

See `env.example.sqlite` for a sample.

### 3) Start the application
```bash
# Terminal 1 - Backend (SQLite)
npm run dev

# Terminal 2 - Frontend
npm run client
```

### 4) Access
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

Notes:
- Ensure port 5000 is free, or set `PORT` in `.env`.
- `CLIENT_URL` must match your frontend origin (for CORS).

## Optional MySQL Setup

Requires MySQL installed and running.

### 1) Create database and load schema
```sql
CREATE DATABASE payroll_management;
```
```bash
mysql -u root -p payroll_management < database.sql
```

### 2) Configure environment
Copy `env.example` to `.env` and set DB_* variables.

### 3) Start with MySQL scripts
```bash
npm run dev:mysql
# or
npm run start:mysql

# optional one-time schema import
npm run setup-db:mysql
```

## Troubleshooting

### Ports
- If 5000 is in use, set `PORT` in `.env`.
- To change React port, set `PORT=3001` in `client/.env`.

### CORS
- Set `CLIENT_URL` to match the frontend origin.

### MySQL connectivity
- Start MySQL; verify host/port
- Fix credentials (DB_USER/DB_PASSWORD)
- Ensure `payroll_management` exists and schema imported

### SQLite
- `SQLITE_CANTOPEN` or locked: check `payroll.db` permissions/locks
