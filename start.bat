@echo off
REM start.bat — One-command Jarvis startup (Windows)
REM Usage: start.bat [--with-sanctum]

setlocal

set "SCRIPT_DIR=%~dp0"
set "NO_SANCTUM=--no-sanctum"

if "%1"=="--with-sanctum" set "NO_SANCTUM="

echo.
echo Jarvis — Grand Soul Kernel Interface
echo =====================================
echo.

REM ── Build kernel if needed ──────────────────────────────────
set "KERNEL_BIN=%SCRIPT_DIR%grand-soul-kernel\target\release\grand-soul-kernel.exe"
if not exist "%KERNEL_BIN%" (
  echo Building kernel (first run^)...
  cd /d "%SCRIPT_DIR%grand-soul-kernel"
  cargo build --release
  if errorlevel 1 (
    echo ERROR: Kernel build failed. Is Rust installed?
    pause
    exit /b 1
  )
  echo.
)

REM ── Install bridge deps if needed ────────────────────────────
if not exist "%SCRIPT_DIR%jarvis-bridge\node_modules" (
  echo Installing bridge dependencies...
  cd /d "%SCRIPT_DIR%jarvis-bridge"
  npm install
  if errorlevel 1 (
    echo ERROR: npm install failed. Is Node.js installed?
    pause
    exit /b 1
  )
  echo.
)

REM ── Copy .env if missing ──────────────────────────────────────
if not exist "%SCRIPT_DIR%jarvis-bridge\.env" (
  copy "%SCRIPT_DIR%jarvis-bridge\.env.example" "%SCRIPT_DIR%jarvis-bridge\.env" >nul
  echo Created jarvis-bridge\.env from .env.example
)

REM ── Start kernel in a new window ─────────────────────────────
echo Starting kernel...
start "Grand Soul Kernel" /min cmd /c "cd /d "%SCRIPT_DIR%grand-soul-kernel" && "%KERNEL_BIN%" %NO_SANCTUM%"

REM Give kernel time to start
timeout /t 2 /nobreak >nul

REM ── Start bridge ──────────────────────────────────────────────
echo Starting bridge...
echo.
echo  Open in browser: http://localhost:3001
echo  Open on phone:   http://YOUR-IP:3001
echo  (Find your IP: run 'ipconfig' and look for IPv4 Address)
echo.
echo  Press Ctrl+C to stop the bridge.
echo  Close the "Grand Soul Kernel" window to stop the kernel.
echo.

cd /d "%SCRIPT_DIR%jarvis-bridge"
node index.js

endlocal
