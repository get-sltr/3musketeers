#!/bin/bash

# Script to open essential project files in Cursor
# Run this when you first open the project, or set it as a startup task

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Files to open
DAILY_LOG="${PROJECT_ROOT}/DAILY_LOG.md"
CURSOR_BUILD_GUIDE="${PROJECT_ROOT}/CURSOR_BUILD_GUIDE.md"
CURSOR_RULES="${PROJECT_ROOT}/src/app/.cursorrules"

echo "📂 Opening essential project files..."
echo "   - DAILY_LOG.md"
echo "   - CURSOR_BUILD_GUIDE.md"
echo "   - Cursor Rules"

# Check if files exist
if [ ! -f "$DAILY_LOG" ]; then
    echo "⚠️  Warning: DAILY_LOG.md not found at $DAILY_LOG"
fi

if [ ! -f "$CURSOR_BUILD_GUIDE" ]; then
    echo "⚠️  Warning: CURSOR_BUILD_GUIDE.md not found at $CURSOR_BUILD_GUIDE"
fi

if [ ! -f "$CURSOR_RULES" ]; then
    echo "⚠️  Warning: Cursor rules not found at $CURSOR_RULES"
fi

# Open files in Cursor/VS Code
if command -v cursor &> /dev/null; then
    cursor "$DAILY_LOG" "$CURSOR_BUILD_GUIDE" "$CURSOR_RULES"
elif command -v code &> /dev/null; then
    code "$DAILY_LOG" "$CURSOR_BUILD_GUIDE" "$CURSOR_RULES"
else
    echo "❌ Neither 'cursor' nor 'code' command found in PATH"
    echo "   Please open these files manually:"
    echo "   - $DAILY_LOG"
    echo "   - $CURSOR_BUILD_GUIDE"
    echo "   - $CURSOR_RULES"
    exit 1
fi

echo "✅ Files opened in Cursor!"

