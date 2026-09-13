# StreamPay frontend

Minimal Next.js (App Router, TypeScript) UI for the StreamPay contract:
connect Freighter, create streams, withdraw accrued funds, top up, cancel.

## Setup

```bash
cd frontend
cp .env.example .env.local   # then fill in NEXT_PUBLIC_STREAMING_CONTRACT_ID
npm install
npm run dev                  # http://localhost:3000
```

Requires the [Freighter](https://www.freighter.app/) browser extension and a
funded account on the configured network (default: testnet — use the
[friendbot](https://developers.stellar.org/docs/dev-tools/tutorials/friendbot))
plus a deployed token contract id (any SAC, e.g. a custom USDC testnet asset).

## Notes

- `npm run build` + `npm run typecheck` run in CI.
- Every mutating call follows: build → simulate → Freighter sign → send → poll.
- Read-only calls (`get_stream`) simulate against the RPC without signing.
- The deposit is in **smallest token units** (stroops for classic assets).
