@echo off
echo Starting Multiplayer Hiring Game...

REM === Start Backend ===
start "Backend" cmd /k "cd /d C:\project\multiplayer-game\server && node index.js"

REM === Start Frontend ===
start "Frontend" cmd /k "cd /d C:\project\multiplayer-game\frontend && npm run dev"
