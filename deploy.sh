#!/usr/bin/env bash
# ------------------------------------------------------------------------------
# Deploy rshdbarabai.com ke production server via rsync + ssh + pm2 reload.
#
# Penggunaan (lokal):
#   ./deploy.sh                    # deploy current HEAD ke server production
#   DRY_RUN=1 ./deploy.sh          # lihat file yang akan di-sync, TANPA mengubah server
#   ./deploy.sh myhost             # deploy ke host alias SSH tertentu
#
# Environment variables (dapat di .env atau export):
#   DEPLOY_USER         (default: $USER)
#   DEPLOY_HOST         (wajib jika $1 tidak diisi, mis. rshdbarabai.com atau IP)
#   DEPLOY_PATH         (wajib, contoh: /var/www/rshdbarabai.com)
#   DEPLOY_PORT         (default: 22)
#   DEPLOY_APP_NAME     (default: rshdbarabaicom, sesuai PM2 ecosystem app name)
#   DEPLOY_EXCLUDE      (opsional, pisah spasi, default sudah ada ci.yaml, deploy.sh, db, uploads, dll.)
#   GITHUB_PRIVATE_REPO (opsional, jika server perlu git clone private, lebih aman skip, pakai rsync aja)
# ------------------------------------------------------------------------------
set -euo pipefail

APP_NAME="${DEPLOY_APP_NAME:-rshdbarabaicom}"
SSH_PORT="${DEPLOY_PORT:-22}"
HOST_ARG="${1:-}"

if [ -z "${HOST_ARG}" ]; then
  if [ -z "${DEPLOY_HOST:-}" ]; then
    echo "❌ ERROR: DEPLOY_HOST tidak diset, dan argumen host kosong."
    echo "   Contoh: DEPLOY_HOST=rshdbarabai.com DEPLOY_USER=root DEPLOY_PATH=/var/www/rshdbarabai.com ./deploy.sh"
    echo "   atau  : ./deploy.sh rshdbarabai.com"
    exit 1
  fi
  HOST="${DEPLOY_HOST}"
else
  HOST="${HOST_ARG}"
fi

USER="${DEPLOY_USER:-$USER}"
SSH_TARGET="${USER}@${HOST}"

if [ -z "${DEPLOY_PATH:-}" ]; then
  echo "❌ ERROR: DEPLOY_PATH tidak diset."
  echo "   Contoh export DEPLOY_PATH=/var/www/rshdbarabai.com"
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "❌ rsync tidak ditemukan. Install dulu (macOS: brew install rsync)."
  exit 1
fi
if ! command -v ssh >/dev/null 2>&1; then
  echo "❌ ssh tidak ditemukan."
  exit 1
fi

LOCAL_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${LOCAL_ROOT}"

EXCLUDES=(
  --exclude ".git/"
  --exclude ".gitignore"
  --exclude ".gitattributes"
  --exclude ".github/"
  --exclude ".trae/"
  --exclude ".vscode/"
  --exclude ".idea/"
  --exclude ".DS_Store"

  --exclude "deploy.sh"

  # Runtime artifacts (server yang generate sendiri)
  --exclude "node_modules/"
  --exclude "dist/"
  --exclude ".vite/"
  --exclude ".tmp-*"
  --exclude "tmp/"
  --exclude "temp/"
  --exclude "logs/"
  --exclude "*.log"

  # Sensitive / mutable: JANGAN timpa dari lokal
  --exclude ".env"
  --exclude "*.sqlite"
  --exclude "*.sqlite3"
  --exclude "*.db"
  --exclude "*.sdb"
  --exclude "*.sdb-journal"
  --exclude "*.sdb-wal"
  --exclude "*.sdb-shm"
  --exclude "uploads/"
  --exclude ".pm2/"
)

if [ -n "${DEPLOY_EXCLUDE:-}" ]; then
  for extra in ${DEPLOY_EXCLUDE}; do
    EXCLUDES+=( --exclude "${extra}" )
  done
fi

echo "▸ Target SSH       : ${SSH_TARGET}:${SSH_PORT}"
echo "▸ Remote path      : ${DEPLOY_PATH}"
echo "▸ PM2 app name     : ${APP_NAME}"
echo "▸ Dry run          : ${DRY_RUN:-0}"
echo "▸ Local root       : ${LOCAL_ROOT}"
echo

SSH_OPTS="-p ${SSH_PORT} -o BatchMode=no -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10"
RSYNC_OPTS=(
  --recursive
  --links
  --perms
  --times
  --group
  --owner
  --devices
  --specials
  --compress
  --human-readable
  --partial
  --progress
  --delete-after
)

if [ "${DRY_RUN:-0}" = "1" ]; then
  RSYNC_OPTS+=( --dry-run --itemize-changes )
  echo "⚠️  MODE DRY_RUN — tidak ada perubahan di server."
  echo
fi

echo "1/5 ▶︎ Memastikan remote path ada..."
# shellcheck disable=SC2029
ssh ${SSH_OPTS} "${SSH_TARGET}" "mkdir -p '${DEPLOY_PATH}' && echo 'OK remote path exists: '\"\$PWD\"/${DEPLOY_PATH}"

echo
echo "2/5 ▶︎ Sync source code via rsync..."
rsync "${RSYNC_OPTS[@]}" "${EXCLUDES[@]}" -e "ssh ${SSH_OPTS}" "./" "${SSH_TARGET}:${DEPLOY_PATH}/"

if [ "${DRY_RUN:-0}" = "1" ]; then
  echo
  echo "✅ Dry run selesai. Tidak ada perubahan di server. Jalankan tanpa DRY_RUN=1 untuk deploy sesungguhan."
  exit 0
fi

echo
echo "3/5 ▶︎ Install dependencies production + build frontend di server..."
# shellcheck disable=SC2029
ssh ${SSH_OPTS} "${SSH_TARGET}" "
  set -euo pipefail
  cd '${DEPLOY_PATH}'
  echo '▶︎ current dir :' \"\$PWD\"
  echo '▶︎ node -v    :' && node -v || true
  echo '▶︎ npm  -v    :' && npm -v || true

  if [ -f package-lock.json ]; then
    npm ci --omit=dev --omit=optional --no-audit --no-fund
  else
    npm install --omit=dev --omit=optional --no-audit --no-fund
  fi

  echo '▶︎ Build frontend (npm run build)'
  npm run build
"

echo
echo "4/5 ▶︎ Health check local app loader + PM2 reload (zero-downtime)..."
# shellcheck disable=SC2029
ssh ${SSH_OPTS} "${SSH_TARGET}" "
  set -euo pipefail
  cd '${DEPLOY_PATH}'

  echo '▶︎ PM2 list apps:'
  command -v pm2 >/dev/null 2>&1 && pm2 list | head -n 20 || echo '(pm2 tidak ada di PATH global, coba via npx pm2...)'

  echo '▶︎ Preflight: load api/app.js untuk sintaks + import check'
  node --input-type=module -e \"import('./api/app.js').then(m => console.log('app load OK'))\" || {
    echo '❌ preflight api/app.js GAGAL. ABORT reload PM2 — tetap jalankan app lama.'
    exit 1
  }

  if command -v pm2 >/dev/null 2>&1; then
    if pm2 describe '${APP_NAME}' >/dev/null 2>&1; then
      echo '▶︎ pm2 reload ${APP_NAME}'
      pm2 reload '${APP_NAME}' --update-env
    else
      echo '▶︎ PM2 app belum ada, start via ecosystem.config.cjs...'
      pm2 startOrReload ecosystem.config.cjs --update-env
    fi
    echo '▶︎ pm2 save'
    pm2 save || true
  elif command -v npx >/dev/null 2>&1 && npx pm2 describe '${APP_NAME}' >/dev/null 2>&1; then
    echo '▶︎ npx pm2 reload ${APP_NAME}'
    npx pm2 reload '${APP_NAME}' --update-env
    npx pm2 save || true
  else
    echo '⚠️  PM2 tidak ditemukan. Tidak bisa reload app otomatis.'
    echo '   Jalankan manual di server: cd ${DEPLOY_PATH} && NODE_ENV=production npm run start'
  fi
"

echo
echo "5/5 ▶︎ Final health check via local HTTP (hanya jika server membuka port HTTP via Nginx/public)..."
set +e
if [ -n "${DEPLOY_PUBLIC_URL:-}" ]; then
  HEALTH_CODE="$(curl -sSI --max-time 15 -o /dev/null -w "%{http_code}" "${DEPLOY_PUBLIC_URL}/api/health")"
  echo "  GET ${DEPLOY_PUBLIC_URL}/api/health  -> HTTP ${HEALTH_CODE}"
  if [ "${HEALTH_CODE}" != "200" ]; then
    echo "⚠️  Health check != 200 — cek log server: pm2 logs ${APP_NAME} --lines 60"
  else
    echo "✅ Public health OK."
  fi
else
  echo "  (skip: DEPLOY_PUBLIC_URL tidak diset — isi untuk auto curl /api/health)"
fi
set -e

echo
echo "🎉 Deploy selesai."
echo "   Logs cepat : ssh -p ${SSH_PORT} ${SSH_TARGET} 'cd ${DEPLOY_PATH} && pm2 logs ${APP_NAME} --lines 40'"
echo "   Rollback   : (jika ada issue) ssh ${SSH_TARGET} 'cd ${DEPLOY_PATH} && pm2 reload ${APP_NAME}' -> atau git restore di server"
