@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title BidMart - Finish

echo ==============================================
echo    BidMart  -  shutting the website down
echo ==============================================
echo.

set /a STOPPED=0

rem Next.js uses 3000, or the next free port if 3000 was taken.
for %%P in (3000 3001 3002 3003) do call :killport %%P

rem Best effort: close the leftover server console window.
taskkill /F /FI "WINDOWTITLE eq BidMart Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Administrator:  BidMart Server*" >nul 2>&1

echo.
if "!STOPPED!"=="0" (
  echo Nothing to stop - BidMart does not appear to be running.
) else (
  echo Done. Stopped !STOPPED! server process^(es^).
)

echo.
echo Your data is saved in data\db.json, so bids, accounts and lots
echo will still be there the next time you run start.bat.
echo.
pause
exit /b 0

rem ----------------------------------------------------------------------
rem :killport <port>  - kill the node.exe process listening on that port
rem ----------------------------------------------------------------------
:killport
for /f "tokens=5" %%I in ('netstat -ano ^| findstr /r /c:":%~1 .*LISTENING" 2^>nul') do (
  tasklist /FI "PID eq %%I" /NH 2>nul | findstr /i "node.exe" >nul
  if not errorlevel 1 (
    echo   stopping BidMart on port %~1  ^(process %%I^)
    taskkill /PID %%I /T /F >nul 2>&1
    set /a STOPPED+=1
  )
)
exit /b 0
