#!/bin/sh
set -e

echo "Pushing database schema..."
npx prisma db push --skip-generate

echo "Starting application..."
exec node dist/index.js
