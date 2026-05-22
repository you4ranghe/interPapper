@echo off
setlocal
title Interpaper - bootRun (port 8081)

set "PROJECT_DIR=C:\Users\ibank\INTERPAPER"
set "JAVA_HOME=C:\Users\ibank\INTERPAPER\.toolchain\jdk-17.0.19+10"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo ============================================
echo   Interpaper - rebuild and run (port 8081)
echo ============================================
echo.
echo [1/3] Killing process on port 8081 (if any)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8081" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo [2/3] Moving to project folder...
cd /d "%PROJECT_DIR%"

echo [3/3] Rebuild and run. Press Ctrl+C to stop.
echo        When started: open http://localhost:8081 and press Ctrl+Shift+R
echo.
call gradlew.bat bootRun --args="--server.port=8081"

echo.
echo App stopped. Press any key to close.
endlocal
pause >nul
