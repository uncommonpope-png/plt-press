#!/usr/bin/env bash
# start.sh — One-command Jarvis startup (Unix/macOS/Linux)
# Usage: ./start.sh [--no-sanctum]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NO_SANCTUM="--no-sanctum"

# Allow passing --with-sanctum to skip the flag
for arg in "$@"; do
  if [ "$arg" == "--with-sanctum" ]; then
    NO_SANCTUM=""
  fi
done

echo ""
echo "🜁 Starting Grand Soul Kernel + Jarvis Bridge"
echo "=============================================="
echo ""

# ── Build kernel if needed ────────────────────────────────────
KERNEL_BIN="$SCRIPT_DIR/grand-soul-kernel/target/release/grand-soul-kernel"
if [ ! -f "$KERNEL_BIN" ]; then
  echo "🔨 Building kernel (first run)..."
  cd "$SCRIPT_DIR/grand-soul-kernel"
  cargo build --release
  echo ""
fi

# ── Install bridge deps if needed ────────────────────────────
if [ ! -d "$SCRIPT_DIR/jarvis-bridge/node_modules" ]; then
  echo "📦 Installing bridge dependencies..."
  cd "$SCRIPT_DIR/jarvis-bridge"
  npm install
  echo ""
fi

# ── Copy .env.example if .env doesn't exist ──────────────────
if [ ! -f "$SCRIPT_DIR/jarvis-bridge/.env" ]; then
  cp "$SCRIPT_DIR/jarvis-bridge/.env.example" "$SCRIPT_DIR/jarvis-bridge/.env"
  echo "📝 Created jarvis-bridge/.env from .env.example"
fi

# ── Start kernel ──────────────────────────────────────────────
echo "🚀 Starting kernel in background..."
cd "$SCRIPT_DIR/grand-soul-kernel"
if [ -n "$NO_SANCTUM" ]; then
  "$KERNEL_BIN" "$NO_SANCTUM" &
else
  "$KERNEL_BIN" &
fi
KERNEL_PID=$!
echo "   Kernel PID: $KERNEL_PID"

# Give kernel a moment to start
sleep 1

# ── Start bridge ──────────────────────────────────────────────
echo "🚀 Starting bridge..."
cd "$SCRIPT_DIR/jarvis-bridge"

# Find local IP for convenience
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ipconfig getifaddr en0 2>/dev/null || echo "your-ip")

echo ""
echo "✅ Jarvis is starting!"
echo ""
echo "   Open on this machine: http://localhost:3001"
if [ -n "$LOCAL_IP" ] && [ "$LOCAL_IP" != "your-ip" ]; then
  echo "   Open on your phone:   http://${LOCAL_IP}:3001"
fi
echo ""
echo "   Press Ctrl+C to stop everything."
echo ""

# Trap Ctrl+C to kill kernel too
trap "echo ''; echo 'Shutting down...'; kill $KERNEL_PID 2>/dev/null; exit 0" INT TERM

node index.js

# If bridge exits, kill kernel
kill $KERNEL_PID 2>/dev/null || true
