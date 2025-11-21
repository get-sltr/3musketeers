#!/bin/bash

# EROS Chat Endpoint Test Script
# Usage: ./test-eros.sh <YOUR_AUTH_TOKEN>

if [ -z "$1" ]; then
  echo "❌ Error: Auth token required"
  echo "Usage: ./test-eros.sh <YOUR_AUTH_TOKEN>"
  echo ""
  echo "Get your token from:"
  echo "1. Login to https://www.getsltr.com"
  echo "2. Open browser DevTools > Application > Local Storage"
  echo "3. Find 'sb-bnzyzkmixfmylviaojbj-auth-token' key"
  exit 1
fi

AUTH_TOKEN="$1"
API_URL="https://sltr-backend.railway.app/api/v1/assistant/chat"

echo "🧪 Testing EROS Chat Endpoint..."
echo "📍 URL: $API_URL"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "message": "Hello EROS, can you help me write a good bio for my dating profile?",
    "context": {}
  }')

echo "📩 Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if response contains Claude output
if echo "$RESPONSE" | grep -q "\"success\":true"; then
  echo "✅ EROS endpoint working"
  
  if echo "$RESPONSE" | grep -q "I'm EROS" && echo "$RESPONSE" | grep -q "matchmaker"; then
    echo "⚠️  WARNING: Placeholder response detected (Claude may not be enabled)"
  else
    echo "✅ Claude AI responding"
  fi
else
  echo "❌ Endpoint returned error"
fi
