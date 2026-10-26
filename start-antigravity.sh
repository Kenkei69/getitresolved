#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
STORE="$ROOT/.antigravity-private"
AUTH="$HOME/.gemini/antigravity-cli"

export PATH="$HOME/.local/bin:$PATH"

if [ ! -d "$STORE" ]; then
  echo "Persistent Antigravity storage missing."
  exit 1
fi

mkdir -p "$HOME/.gemini"

if [ ! -e "$AUTH" ] && [ ! -L "$AUTH" ]; then
  ln -s "$STORE" "$AUTH"
elif [ ! -L "$AUTH" ]; then
  echo "Existing configuration is not a symlink. Leaving it untouched."
  exit 1
fi

if ! command -v agy >/dev/null 2>&1; then
  echo "Antigravity executable missing. Reinstall agy first."
  exit 1
fi

exec agy "$@"
