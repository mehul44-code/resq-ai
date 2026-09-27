@echo off
setlocal

set ROOT=C:\Users\LENOVO\Desktop\Ai_main\resq-ai
set PYTHON=C:\Users\LENOVO\AppData\Local\Programs\Python\Python312\python.exe
set NPM=C:\Program Files\nodejs\npm.cmd
set FRONTEND=%ROOT%\frontend
set BACKEND=%ROOT%\backend

start "Backend" cmd /k "cd /d "%BACKEND%" && "%PYTHON%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

ping 127.0.0.1 -n 8 > nul

start "Frontend Preview" cmd /k "cd /d "%FRONTEND%" && set PATH=C:\Program Files\nodejs;%PATH% && "%NPM%" run build && "%NPM%" run preview -- --host 0.0.0.0 --port 4173"

echo.
echo API: http://127.0.0.1:8000/api/health
echo Frontend Preview: http://127.0.0.1:4173

echo.
echo Wait a few seconds for the build to finish before opening the browser.
