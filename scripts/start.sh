#!/usr/bin/env bash
# One-click start for Octop.
#
#   scripts/start.sh            # desktop shell (default)
#   scripts/start.sh desktop    # same as above
#   scripts/start.sh dev        # browser development: Vite + backend (make dev)
#   scripts/start.sh stop       # only stop existing instances
#
# Always stops any existing Octop desktop/dev instance first, then starts.
# This is intentional: restarting is the default so a second launch never
# stacks duplicate windows or hits "port already in use".
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-desktop}"

usage() {
  cat <<'EOF'
Usage: scripts/start.sh [desktop|dev|stop]

  desktop   Octop desktop shell (Wails). Default.
            Always stops any existing instance first, then starts.
  dev       Browser development: Vite frontend + backend (make dev).
            Same stop-then-start behavior.
  stop      Stop existing Octop desktop/dev instances and free ports.

  -h, --help  Show this help.
EOF
}

case "$MODE" in
  -h | --help | help)
    usage
    exit 0
    ;;
  desktop | dev | stop) ;;
  *)
    echo "Unknown mode: $MODE" >&2
    usage >&2
    exit 2
    ;;
esac

# wails3 is installed to $(go env GOPATH)/bin and is often not on PATH.
if command -v go >/dev/null 2>&1; then
  export PATH="$(go env GOPATH)/bin:$PATH"
fi

# Kill whatever is listening on a TCP port (TERM, wait, then KILL).
free_port() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null | tr '\n' ' ' || true)"
  if [[ -z "${pids// /}" ]]; then
    return 0
  fi
  echo "[start] port ${port} busy (pid: ${pids}), stopping..."
  # shellcheck disable=SC2086
  kill ${pids} 2>/dev/null || true
  for _ in 1 2 3 4 5 6; do
    sleep 0.3
    if ! lsof -tiTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
  done
  # shellcheck disable=SC2086
  kill -9 ${pids} 2>/dev/null || true
  sleep 0.2
}

# Stop every process belonging to this repo's start/dev/desktop flow, then
# release the ports those flows use. Safe to run when nothing is running.
stop_all() {
  echo "[start] stopping existing Octop desktop/dev instances..."

  # Starter scripts (absolute and relative invocations).
  # Do NOT pkill start.sh / make start — that would kill the current run.
  pkill -f "bash ${ROOT}/desktop/package-dev.sh" 2>/dev/null || true
  pkill -f "bash desktop/package-dev.sh" 2>/dev/null || true
  pkill -f "${ROOT}/desktop/package-dev.sh" 2>/dev/null || true
  pkill -f "make dev" 2>/dev/null || true

  # Backend started by package-dev.sh / make dev (this repo's venv only).
  pkill -f "${ROOT}/.venv/bin/octop run" 2>/dev/null || true
  pkill -f "${ROOT}/.venv/bin/python .*octop run" 2>/dev/null || true

  # Wails toolchain + desktop windows from a previous package-dev / wails3 run.
  pkill -f "wails3 dev" 2>/dev/null || true
  pkill -f "wails3 task" 2>/dev/null || true
  pkill -f ".task/devserver" 2>/dev/null || true
  pkill -f "Octop.dev.app/Contents/MacOS/Octop" 2>/dev/null || true

  # Vite leftovers from make dev (this repo's dashboard).
  pkill -f "${ROOT}/dashboard/node_modules/.bin/vite" 2>/dev/null || true

  sleep 0.5

  # Ports owned by the flows above: backend, Wails devserver, Vite.
  free_port 8088
  free_port 9245
  free_port 5173
  free_port 5174

  echo "[start] stopped."
}

ensure_frontend_built() {
  if [[ -f "${ROOT}/src/octop/dashboard/index.html" ]]; then
    return 0
  fi
  echo "[start] dashboard bundle missing, running make build-frontend..."
  make -C "${ROOT}" build-frontend
}

check_desktop_toolchain() {
  if ! command -v go >/dev/null 2>&1; then
    echo "go is not installed (need Go 1.25+)." >&2
    echo "  macOS: brew install go" >&2
    exit 1
  fi
  if ! command -v wails3 >/dev/null 2>&1; then
    echo "wails3 is not installed." >&2
    echo "  go install github.com/wailsapp/wails/v3/cmd/wails3@v3.0.0-beta.13" >&2
    echo "  export PATH=\"\$(go env GOPATH)/bin:\$PATH\"" >&2
    exit 1
  fi
}

echo "[start] mode=${MODE}"

# Default behavior for desktop/dev: stop first, then start.
stop_all

if [[ "$MODE" == "stop" ]]; then
  exit 0
fi

if [[ "$MODE" == "desktop" ]]; then
  check_desktop_toolchain
  ensure_frontend_built
  echo "[start] launching desktop shell..."
  exec bash "${ROOT}/desktop/package-dev.sh"
fi

echo "[start] launching make dev (browser)..."
exec make -C "${ROOT}" dev
