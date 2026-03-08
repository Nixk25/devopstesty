#!/bin/bash
set -e

BASE_URL="${1:-http://localhost:3000}"
PASSED=0
FAILED=0

check() {
  local description="$1"
  local method="$2"
  local url="$3"
  local expected_code="$4"
  local payload="$5"

  if [ -n "$payload" ]; then
    actual_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" -d "$payload")
  else
    actual_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url")
  fi

  if [ "$actual_code" = "$expected_code" ]; then
    echo "PASS: $description (HTTP $actual_code)"
    PASSED=$((PASSED + 1))
  else
    echo "FAIL: $description (expected $expected_code, got $actual_code)"
    FAILED=$((FAILED + 1))
  fi
}

echo "Running smoke tests against $BASE_URL"
echo "======================================="

check "Health check" GET "$BASE_URL/health" 200

check "Create room" POST "$BASE_URL/api/rooms" 201 \
  '{"name":"Smoke Test Room","capacity":10}'

check "List rooms" GET "$BASE_URL/api/rooms" 200

check "Create user" POST "$BASE_URL/api/users" 201 \
  '{"name":"Smoke User","email":"smoke@test.com"}'

check "List users" GET "$BASE_URL/api/users" 200

check "Invalid room returns 400" POST "$BASE_URL/api/rooms" 400 \
  '{"name":"","capacity":10}'

check "List reservations" GET "$BASE_URL/api/reservations" 200

echo "======================================="
echo "Results: $PASSED passed, $FAILED failed"

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
