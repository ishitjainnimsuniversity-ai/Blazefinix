@echo off
title LOOP AI Customer Feedback Intelligence - Setup & Run
echo ===================================================================
echo   LOOP AI Customer-Feedback Intelligence Platform
echo   Step 1: Installing Dependencies (npm install)...
echo ===================================================================
call npm install
echo.
echo ===================================================================
echo   Step 2: Executing Vitest Test Suite (npm run test)...
echo ===================================================================
call npm run test
echo.
echo ===================================================================
echo   Step 3: Launching Dev Server on http://localhost:3005 ...
echo ===================================================================
call npm run dev
pause
