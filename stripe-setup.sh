#!/bin/bash

# Stripe Setup Script for SLTR
# This script sets up Stripe CLI for local development

echo "🚀 Setting up Stripe CLI for SLTR..."

# Step 1: Install Stripe CLI via Homebrew
echo ""
echo "📦 Step 1: Installing Stripe CLI..."
brew install stripe/stripe-cli/stripe

# Step 2: Login to Stripe (interactive - opens browser)
echo ""
echo "🔐 Step 2: Logging into Stripe..."
echo "⚠️  This will open your browser for authentication"
stripe login

# Step 3: Start webhook forwarding (this runs in foreground)
echo ""
echo "📡 Step 3: Starting webhook forwarding..."
echo "⚠️  IMPORTANT: Copy the webhook signing secret shown below!"
echo "⚠️  Add it to .env.local as STRIPE_WEBHOOK_SECRET"
echo ""
echo "Starting webhook listener on localhost:3000/api/webhooks/stripe..."
echo "Press Ctrl+C to stop when done"
echo ""

stripe listen --forward-to localhost:3000/api/webhooks/stripe













