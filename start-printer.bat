@echo off
setlocal EnableDelayedExpansion
title Venezia Pizza - Thermal Printer Service (Zjiang ZJ-8330-L)
color 0A

cd /d "%~dp0"

echo ======================================================================
echo    VENEZIA PIZZA - AUTOMATIC THERMAL PRINTER SERVICE
echo    Supports: Zjiang ZJ-8330-L (80mm USB Thermal Receipt Printer)
echo ======================================================================
echo.

where node >nul 2>nul
if %errorlevel% equ 0 goto node_found
color 0C
echo [ERROR] Node.js is not installed or not found in PATH!
echo Please install Node.js from https://nodejs.org/
echo Then double-click this file again.
echo.
pause
exit /b 1

:node_found
:: Clean up any stale process locking port 9090
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":9090" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%p >nul 2>nul
)

echo [*] Starting Thermal Printer Service on http://127.0.0.1:9090 ...
echo [*] Listening for new customer orders and USB print requests...
echo [*] Keep this window open or minimized.
echo [*] Press Ctrl+C or close this window to stop the service.
echo.

:run
node server/printer/printerService.js
set SERVICE_ERR=%errorlevel%
if %SERVICE_ERR% neq 0 (
    echo.
    echo [!] Printer service exited with error code %SERVICE_ERR%.
    echo Press any key to restart the printer service...
    pause
    goto run
)

echo.
echo [*] Printer service closed.
pause
