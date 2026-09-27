@echo off
setlocal

set ROOT=C:\Users\LENOVO\Desktop\Ai_main\resq-ai
set PYTHON=C:\Users\LENOVO\AppData\Local\Programs\Python\Python312\python.exe
set NPM=C:\Program Files\nodejs\npm.cmd
set FRONTEND=%ROOT%\frontend
set BACKEND=%ROOT%\backend

start "Backend" cmd /k "cd /d "%BACKEND%" && "%PYTHON%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

ping 127.0.0.1 -n 8 > nul

start "Frontend" cmd /k "cd /d "%FRONTEND%" && set PATH=C:\Program Files\nodejs;%PATH% && "%NPM%" run dev -- --host 0.0.0.0 --port 5173"

ping 127.0.0.1 -n 12 > nul

echo.
echo API: http://127.0.0.1:8000/api/health
echo Frontend: http://127.0.0.1:5173

echo.
echo If the browser shows connection refused, keep the two windows open and wait a few seconds.
