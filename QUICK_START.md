# 🚀 QUICK START GUIDE

## Default: SQLite (no database server required)

```bash
# 1. Install dependencies
npm install
cd client && npm install && cd ..

# 2. Start the backend (SQLite)
npm run dev

# 3. In a new terminal, start the frontend
npm run client
```

Access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

Login:
- **Admin**: admin@payroll.com / password
- **Employee**: john.doe@company.com / password

Notes:
- Ensure port `5000` is free before starting the backend, or set `PORT` in `.env`.
- Set `CLIENT_URL` in `.env` to your frontend origin to avoid CORS issues.

---

## Optional: MySQL setup (requires MySQL installed and running)

1) Install and start MySQL (XAMPP or standalone)
2) Create DB and load schema:
```sql
CREATE DATABASE payroll_management;
```
```bash
mysql -u root -p payroll_management < database.sql
```
3) Configure environment: copy `env.example` to `.env` and set DB vars
4) Start with MySQL scripts:
```bash
npm run dev:mysql         # backend in dev
npm run start:mysql       # backend in prod
npm run setup-db:mysql    # optional schema import
```

Troubleshooting:
- MySQL connection refused: start MySQL; verify DB_HOST/credentials
- Access denied: fix DB_USER/DB_PASSWORD in `.env`
- DB not found: create `payroll_management` and import `database.sql`
