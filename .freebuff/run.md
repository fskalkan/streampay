# StreamPay — Preview run doc

This thread's Preview tab currently serves a **static HTML dashboard** (no dev server, no port, no install):

- Registered file: `C:\streampay\.freebuff\preview.html` → http://127.0.0.1:53422/preview.html
- Mode: `register_preview { htmlPath }` (lightest mode — the file must live inside the thread workspace)

## 1. Reproduce the artifacts

Nothing external is needed. The dashboard is a single self-contained HTML file (inline CSS/JS, no network
dependencies):

- `C:\streampay\.freebuff\preview.html` — written by the agent with `write_file`; recreate by copying it from
  this repo checkout or regenerating from `docs/ARCHITECTURE.md` content. It mirrors the contract's accrual
  formula (`streamed = deposit × elapsed / duration`, floor division, BigInt) so the simulator behaves exactly
  like `stream::streamed_at`.

If this file is missing, re-register by creating any standalone `.html` file inside the thread workspace and
calling `register_preview` with its absolute `htmlPath`.

## 2. Run the server (static mode)

**No server.** After (re)creating the file, register it:

```
register_preview { htmlPath: "C:\\streampay\\.freebuff\\preview.html" }
```

The app serves it on a loopback port automatically and reloads on file changes. Verify with
`preview_snapshot` (page must show "40 / 40" tests badge and the accrual simulator) and
`preview_evaluate` (move `#slider` to 50% → `#outStreamed` must equal half the deposit).

## 3. Switching to the Next.js frontend (when `/frontend` is ready)

The Next.js UI is scaffolded but not installed. To preview it instead of the static dashboard:

1. Reproduce artifacts:
   - `cd C:\streampay\frontend`
   - `npm install` (uses `package.json` / `package-lock.json` — lockfile is committed)
   - If a `.env.local` exists in the main checkout, **copy** (never symlink) it into `frontend\` — it holds
     `NEXT_PUBLIC_SOROBAN_RPC_URL` and `NEXT_PUBLIC_STREAMING_CONTRACT_ID`.
2. Run detached (Windows PowerShell; stdout/stderr must go to **different** files):
   ```powershell
   powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput 'C:\streampay\.freebuff\preview.log' -RedirectStandardError 'C:\streampay\.freebuff\preview.log.err' -WindowStyle Hidden -PassThru).Id"
   ```
3. Confirm `Get-Process -Id <pid>` is alive, poll `http://localhost:3000` until it answers, then
   `register_preview { url: "http://localhost:3000", pid }`.

Notes:
- Port 3000 was free at doc time; if taken, pass `-ArgumentList 'run','dev','--','-p','3001'` and register that URL.
- The Rust contract is not servable in a browser preview: `cargo test -p streampay-contract` is the
  verification path for the contract (CI runs the same).
