#!/bin/bash

# Apply pending migrations to Supabase
# Run from project root: ./scripts/apply-migrations.sh

set -e

echo "🔄 Applying database migrations..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Apply all pending migrations
echo "📦 Running migrations..."
supabase db push

echo "✅ Migrations applied successfully!"
echo ""
echo "📋 Applied migrations:"
echo "  - Online status column standardization (online -> is_online alias)"
echo "  - SLTR subscription privileges (subscription_tier, subscription_expires_at)"
echo "  - DTFN activations tracking"
echo "  - Feature usage tracking"
echo ""
echo "🎉 Database is up to date!"
