#!/bin/bash

# Daily Log Reminder Script
# This script checks if today's log entry exists and reminds if missing
# Can be added to cron or run manually

DAILY_LOG_PATH="$(dirname "$0")/../DAILY_LOG.md"
TODAY=$(date +"%A, %B %d, %Y")
TODAY_HEADER="### $TODAY"

if [ ! -f "$DAILY_LOG_PATH" ]; then
    echo "❌ DAILY_LOG.md not found at $DAILY_LOG_PATH"
    exit 1
fi

if grep -q "$TODAY_HEADER" "$DAILY_LOG_PATH"; then
    echo "✅ Today's log entry exists: $TODAY"
    exit 0
else
    echo "⚠️  WARNING: Today's log entry ($TODAY) is missing!"
    echo "📝 Run 'npm run log:new' to create today's entry"
    echo ""
    echo "Today's date: $TODAY"
    exit 1
fi

