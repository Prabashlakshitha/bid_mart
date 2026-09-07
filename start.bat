@echo off
setlocal
cd /d "%~dp0"
title BidMart - Start

echo ==============================================
echo    BidMart  -  starting the local website
echo ==============================================
echo.

rem ---- 0. is Node.js installed? -----------------------------------------
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found on this computer.
  echo         Install the LTS version from https://nodejs.org
  echo         then double-click this file again.
  echo.
  pause
  exit /b 1
)

rem ---- 0b. is it already running? ---------------------------------------
netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo BidMart already appears to be running on http://localhost:3000
  echo Opening it in your browser...
  start "" http://localhost:3000
  echo.
  echo Run finish.bat first if you want to restart it cleanly.
  echo.
  pause
  exit /b 0
)

rem ---- 1. dependencies --------------------------------------------------
if not exist "node_modules" (
  echo [1/3] Installing dependencies. First run only - this can take a few minutes...
  call npm install
  if errorlevel 1 goto :fail
) else (
  echo [1/3] Dependencies already installed - skipping.
)
echo.

rem ---- 2. database ------------------------------------------------------
if not exist "data\db.json" (
  echo [2/3] Creating the demo database...
  call npm run seed
  if errorlevel 1 goto :fail
) else (
  echo [2/3] Database found - keeping your current data.
  echo       To reset it back to the sample lots, run:  npm run seed
)
echo.

rem ---- 3. start the dev server in its own window ------------------------
echo [3/3] Starting the server in a new window titled "BidMart Server"...
start "BidMart Server" cmd /k npm run dev

echo       Waiting for http://localhost:3000 to come up...
set /a TRIES=0

:wait
set /a TRIES+=1
netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul 2>&1
if not errorlevel 1 goto :ready
if %TRIES% geq 60 goto :slow
rem ping is used instead of "timeout" because timeout fails in some consoles
ping -n 2 127.0.0.1 >nul
goto :wait

:ready
echo.
echo ----------------------------------------------
echo   BidMart is running:  http://localhost:3000
echo ----------------------------------------------
echo.
echo   Demo accounts:
echo     Admin:  admin@bidmart.test  /  admin123
echo     Buyer:  buyer@bidmart.test  /  buyer123
echo.
echo   When you are done, double-click finish.bat to shut it down.
echo   (Leave the "BidMart Server" window open while you use the site.)
echo.
echo   (The first page load takes a few seconds while Next.js compiles.)
echo.
start "" http://localhost:3000
ping -n 6 127.0.0.1 >nul
exit /b 0

:slow
echo.
echo [WARNING] The server did not answer on port 3000 within 60 seconds.
echo           Check the "BidMart Server" window for an error message.
echo.
pause
exit /b 1

:fail
echo.
echo [ERROR] A setup step failed - see the messages above.
echo.
pause
exit /b 1
