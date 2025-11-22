# 🚀 QUICK START - EROS

## Start Everything

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
npm run dev
```

## Test EROS

1. Open: http://localhost:5000
2. Click lime green cupid button (bottom right)
3. Type "hi" and press Enter
4. Get response from Claude AI ✅

## Check Status

```bash
./test-eros-connection.sh
```

## View Logs

```bash
tail -f backend/backend.log | grep EROS
```

## Stop

```bash
# Backend
kill $(lsof -ti:3001)

# Frontend
Ctrl+C in terminal
```

That's it! 🎉
