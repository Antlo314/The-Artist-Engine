# The Artist Engine — Pricing (MVP)

## Plans

| Plan | Monthly | Annual | Credits/mo | Masters/day |
|------|---------|--------|------------|-------------|
| Spark | $0 | $0 | 30 | 1 |
| Creator | $19 | $180 | 200 | 5 |
| Pro | $49 | $468 | 800 | 15 |
| Label | $129 | $1,188 | 3,000 | 40 |

## Credit packs

| Pack | Credits | Price |
|------|---------|-------|
| Boost | 100 | $9 |
| Session | 400 | $29 |
| Tour | 1,500 | $89 |
| Label Pack | 5,000 | $249 |

## Credit costs

- Master: 15 · Stems: 20 · Oracle: 5 · Scout: 8 · Pitch: 3 · Contract AI: 12

## Investor promo

- Code: `engine26!` (login required)
- Effect: ×5 daily limits, monthly credits, lead caps, scout cities
- Duration: 90 days

## Env

```
GOOGLE_CLIENT_ID=
GOOGLE_AUTH_MOCK=1          # dev only — mock Google tokens
BILLING_MOCK_UPGRADE=1      # demo upgrades without Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_CREATOR_MONTHLY=
FRONTEND_URL=http://localhost:5173
VITE_GOOGLE_CLIENT_ID=      # frontend
```
