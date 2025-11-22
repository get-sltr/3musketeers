#!/bin/bash
# Quick EROS Connection Test

echo "🧪 Testing EROS Backend Connection..."
echo ""

# 1. Health check
echo "1️⃣  Health Check:"
curl -s http://localhost:3001/api/health | jq .
echo ""

# 2. Check if backend is responding
echo "2️⃣  Backend Status:"
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running and responding"
else
    echo "❌ Backend is not responding"
    exit 1
fi
echo ""

# 3. Show what URL frontend should use
echo "3️⃣  Frontend Configuration:"
echo "In your browser, EROS should connect to:"
echo "   http://localhost:3001"
echo ""
echo "Check frontend .env.local has:"
echo "   NEXT_PUBLIC_DEV_BACKEND_URL=http://localhost:3001"
echo ""

# 4. Check if frontend is also running
echo "4️⃣  Frontend Status:"
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running on port 3000"
elif lsof -i :5000 > /dev/null 2>&1; then
    echo "✅ Frontend is running on port 5000"
else
    echo "⚠️  Frontend is not running"
    echo "   Start it with: npm run dev"
fi
echo ""

echo "✅ Backend is ready! Try EROS chat now."
echo ""
echo "📋 Backend Logs:"
echo "   tail -f backend/backend.log"
