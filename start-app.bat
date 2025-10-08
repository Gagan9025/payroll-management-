@echo off
setlocal

echo Starting Payroll Management System...
echo.

REM Usage: start-app.bat [mysql] [port]
set MODE=%1
set PORT_ARG=%2

REM Default backend port
set PORT_VAR=5000
if not "%PORT_ARG%"=="" set PORT_VAR=%PORT_ARG%

REM Resolve script root directory (trailing backslash retained)
set "ROOT=%~dp0"

if /I "%MODE%"=="mysql" (
  echo Starting Backend Server - MySQL...
  set "BACKEND_CMD=npm run dev:mysql"
) else (
  echo Starting Backend Server - SQLite...
  set "BACKEND_CMD=npm run dev"
)

REM Start backend in a new window
start "" cmd /k "cd /d \"%ROOT%\" & set PORT=%PORT_VAR% & set CLIENT_URL=http://localhost:3000 & %BACKEND_CMD%"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend (React)...
start "" cmd /k "cd /d \"%ROOT%client\" & npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:%PORT_VAR%
echo Frontend: http://localhost:3000
echo.
echo Login Credentials:
echo Admin: admin@payroll.com / password
echo Employee: john.doe@company.com / password
echo.
echo Notes:
echo - Ensure port %PORT_VAR% is free or set PORT in .env
echo - CLIENT_URL must match frontend origin to avoid CORS
echo - Use ^"start-app.bat mysql^" to run in MySQL mode (requires MySQL running)
echo.
pause
endlocal
