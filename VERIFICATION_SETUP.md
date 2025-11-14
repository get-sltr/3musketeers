# Stripe Identity Verification Setup

## Installation

You need to install the Stripe Identity JavaScript SDK:

```bash
npm install @stripe/identity-js
```

## Environment Variables

Make sure these are set in your `.env.local`:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Stripe Dashboard Setup

1. **Enable Stripe Identity** in your Stripe Dashboard
   - Go to: https://dashboard.stripe.com/settings/identity
   - Enable Identity verification

2. **Set up Webhook Endpoint**
   - Go to: https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select these events:
     - `identity.verification_session.verified`
     - `identity.verification_session.requires_input`
     - `identity.verification_session.processing`
     - `identity.verification_session.canceled`

3. **Get Webhook Secret**
   - After creating the webhook, copy the "Signing secret"
   - Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

## Database Schema

Make sure your `profiles` table has these columns:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
```

## Usage

Users can verify their identity by visiting `/verify`. The flow:

1. User clicks "Start Verification"
2. Stripe Identity UI opens (user uploads ID)
3. Stripe processes verification
4. Webhook updates user's `verified` status in database
5. User sees verified badge on profile

## Testing

For local testing, use Stripe CLI to forward webhooks:

```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

This will give you a webhook secret for local testing.


