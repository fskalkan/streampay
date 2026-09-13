# ⚡ StreamPay

**Continuous, per-second payment streams for the Stellar network — Sablier-style money flow, native to Soroban.**

[![CI](https://github.com/Neziahtech/streampay/actions/workflows/ci.yml/badge.svg)](./.github/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![tests](https://img.shields.io/badge/tests-40%2F40%20passing-brightgreen)]()

> A payroll line that pays by the second. A vesting schedule your team can watch tick. A subscription that cancels itself the moment funding stops — with every unearned token refunded.

StreamPay is a Soroban smart contract that locks a deposit and releases it **linearly over time** to a recipient. The recipient withdraws accrued funds whenever they like; the sender can top up mid-stream or cancel, splitting the remaining funds fairly: earned tokens to the recipient, unearned tokens back to the sender. Similar in spirit to Sablier on Ethereum, designed from scratch for Stellar's ledger model.

## Why

- **Payroll**: pay contractors or DAO contributors by the second instead of by invoice — they can withdraw as they earn, with zero counterparty risk on accrued funds.
- **Vesting**: lock team/investor tokens in a transparent, immutable schedule.
- **Subscriptions & escrow**: fund a stream; when it runs dry, service stops. Cancelling returns what wasn't earned.

Everything is on-chain and trust-minimized: no admin key, no upgrade path, funds only ever move per the stream rules.

## How streams accrue

```text
 deposit ─────────────── locked in the contract ──────────────▶
 ██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
             │ linear per-second release, floor division
 time ────── start_time ────────────────────── end_time ─────▶

 streamed(t) = deposit × elapsed / duration   (u128 checked, floored)
 available   = streamed − withdrawn           ; 0 before start_time
 on cancel : recipient ← available,  sender ← deposit − streamed
```

A stream is a half-open window `[start_time, end_time)`. At any ledger timestamp the contract computes `deposit × elapsed / duration` with checked math (products widened to `u128`, results floored to whole token units and capped at the deposit). **Every edge case you can think of — withdrawing before start, after end, cancelling a never-started stream, topping up after end — is covered by a unit test** (see `contracts/streaming-payments/src/test.rs`).

## Architecture overview

```text
/frontend (Next.js + Freighter)         /docs/ARCHITECTURE.md
        │  sign & submit txs                   │ design deep-dive
        ▼                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  StreamingPayments (Soroban)                 │
│                                                              │
│  create_stream ─┐   withdraw ─┐   top_up ─┐   cancel_stream  │
│                 │             │            │        │        │
│            ┌────┴─────────────┴────────────┴────────┴────┐   │
│            │  Stream { sender, recipient, token,         │   │
│            │            deposit, withdrawn, start_time,  │   │
│            │            end_time, cancelable, status }   │   │
│            │  persistent storage + TTL extension         │   │
│            └──────────────────┬──────────────────────────┘   │
└───────────────────────────────┼──────────────────────────────┘
                                ▼
                     SAC / standard token interface
```

Deep dive (storage model, checked math, reentrancy, TTL strategy, design decisions): [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Contract API

| Function | Caller | Moves tokens | Emits |
|---|---|---|---|
| `create_stream(sender, recipient, token, deposit, start, end, cancelable) → u64` | anyone (sender auth required) | pulls deposit in | `StreamCreated` |
| `withdraw(stream_id, amount)` | recipient | pays out ≤ accrued | `Withdrawn` |
| `cancel_stream(caller, stream_id)` | sender; recipient iff `cancelable` | pro-rata split, atomic | `StreamCancelled` |
| `top_up(stream_id, amount)` | sender | pulls added funds | `StreamToppedUp` |
| `get_stream(stream_id) → Stream` | — (read-only) | — | — |
| `available(stream_id) → i128` | — (read-only) | — | — |

Creating a stream requires a prior token approval: `token.approve(sender, <contract id>, deposit, exp)`. All failures return typed `StreamError` codes (no panics) — see `contracts/streaming-payments/src/errors.rs`.

## Getting started (clean machine)

Prerequisites:

1. **Rust** ≥ 1.84: <https://rustup.rs>
2. **Stellar CLI** (for deploy + Wasm build): `cargo install stellar-cli --locked`
3. **Node.js** ≥ 20 (frontend only): <https://nodejs.org>

Build and test the contract:

```bash
cargo test -p streampay-contract        # 40 unit + property tests
cargo fmt --all -- --check              # formatting gate
cargo clippy --all-targets -- -D warnings
stellar contract build                  # Wasm → target/wasm32v1-none/release/*.wasm
```

Run the frontend:

```bash
cd frontend
cp .env.example .env.local    # set NEXT_PUBLIC_STREAMING_CONTRACT_ID
npm install
npm run dev                   # http://localhost:3000
```

Deploy to testnet:

```bash
stellar keys generate deployer --network testnet --fund
stellar contract deploy \
  --wasm target/wasm32v1-none/release/streampay_contract.wasm \
  --source deployer --network testnet
```

## Repo layout

```text
contracts/streaming-payments/   the contract (lib.rs, stream.rs, errors.rs, events.rs, test.rs)
frontend/                       minimal Next.js UI (Freighter wallet)
docs/ARCHITECTURE.md            design deep-dive
.github/workflows/ci.yml        test + fmt + clippy + frontend typecheck/build on every PR
```

## Roadmap

- **v0.1** — core contract: create / withdraw / cancel / top-up, 40 tests, CI ✅
- **v0.2** — `pause_stream` (good first issue), event indexer service
- **v0.3** — fuzzing in CI (`cargo-fuzz` on the rate math), multi-token batch stream creation
- **v0.4** — full web UI polish (stream discovery by recipient, accrual charts), testnet example scripts
- **v1.0** — external audit, mainnet deployment guide

Feature requests live in [`.github/ISSUE_TEMPLATE/`](./.github/ISSUE_TEMPLATE/) — good first issues are tagged [`good first issue`](https://github.com/Neziahtech/streampay/labels/good%20first%20issue) and documented in [`docs/GOOD_FIRST_ISSUES.md`](./docs/GOOD_FIRST_ISSUES.md).

## Contributing

PRs welcome! Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md) — it covers conventions, branch/PR process, and how to run the tests locally. Every PR runs the full test suite, fmt, clippy (`-D warnings`), and the frontend build in CI.

## Funding & sustainability

StreamPay is community-funded:

- **GrantFox** — bounties on good-first-issues and roadmap features. Install the GrantFox GitHub App on your fork to earn while contributing.
- **Drips** — list StreamPay as a dependency to split funding to upstream projects it builds on.

## License

[Apache-2.0](./LICENSE)
