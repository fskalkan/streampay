# Security policy

## Supported versions

| Version | Supported |
|---|---|
| main branch | ✅ |

## Reporting a vulnerability

StreamPay moves real funds. If you find a bug that could move funds
incorrectly, break an invariant (`0 ≤ withdrawn ≤ streamed ≤ deposit`, or the
contract-balance coverage invariant), or bypass an auth check:

1. **Do not open a public issue.**
2. Email the maintainers via the address in the repo's GitHub settings, or use
   GitHub's [private vulnerability reporting](
   https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability).
3. Include a reproduction (test, tx traces, or a written scenario).

We aim to acknowledge within 72 hours and will credit reporters in the
release notes unless they prefer anonymity. Please give us a reasonable
window to fix before public disclosure.

## Invariants worth testing against

- Per stream: `0 ≤ withdrawn ≤ streamed ≤ deposit`.
- Global: contract token balance ≥ Σ(deposit − withdrawn) over live streams.
- Every payout path is checks-effects-interactions ordered (no reentrancy
  window on token transfers).
- All expected failures return `StreamError` codes; no panics on any input.
