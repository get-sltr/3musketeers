#!/bin/bash

# Quick script to set super admin status
# Usage: ./scripts/set-super-admin.sh YOUR_EMAIL

EMAIL=$1

if [ -z "$EMAIL" ]; then
  echo "❌ Please provide your email:"
  echo "Usage: ./scripts/set-super-admin.sh your@email.com"
  exit 1
fi

echo "🔍 Checking super admin status for: $EMAIL"
echo ""

# Run via Supabase CLI
supabase db execute --stdin <<SQL
-- Check current status
SELECT 
  id, 
  email, 
  is_super_admin,
  display_name
FROM profiles 
WHERE email ILIKE '$EMAIL';

-- Set as super admin
UPDATE profiles 
SET is_super_admin = true 
WHERE email ILIKE '$EMAIL';

-- Verify
SELECT 
  id, 
  email, 
  is_super_admin,
  display_name
FROM profiles 
WHERE email ILIKE '$EMAIL';
SQL

echo ""
echo "✅ Done! Refresh your browser to see admin dashboard."
