#!/usr/bin/env bash
set -euo pipefail

if [ ! -d ".git" ]; then
  git init -b main
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  if [ "${1:-}" != "" ]; then
    git remote add origin "$1"
  else
    read -r -p "Masukkan URL repositori GitHub (contoh: https://github.com/username/simaguru-smk-garnesia.git): " REPO_URL
    if [ -z "$REPO_URL" ]; then
      echo "URL repositori tidak boleh kosong."
      exit 1
    fi
    git remote add origin "$REPO_URL"
  fi
fi

git add .

if git diff --cached --quiet; then
  echo "Tidak ada perubahan baru untuk di-commit."
else
  MSG="${2:-Update SIMAGURU SMK Garnesia}"
  git commit -m "$MSG"
fi

git branch -M main
git push -u origin main
echo "Berhasil push ke GitHub branch main."
