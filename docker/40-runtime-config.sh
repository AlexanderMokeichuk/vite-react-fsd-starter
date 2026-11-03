#!/bin/sh
set -eu

: "${BACKEND_URL:?BACKEND_URL is required, e.g. -e BACKEND_URL=http://backend:8080}"

OUT=/usr/share/nginx/html/config.js

json=$(env | grep '^APP_' | sort | while IFS='=' read -r key value; do
  esc=$(printf '%s' "$value" | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf '"%s":"%s",' "$key" "$esc"
done)

printf 'window.__APP_CONFIG__={%s};\n' "${json%,}" > "$OUT"
echo "[runtime-config] wrote $OUT"
