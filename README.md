# adr-lens
Real-time ADR parity, premium/discount, FX, and return attribution monitor. Built for identifying pricing dislocations between U.S. ADRs and their underlying foreign shares.

## Web dashboard

The project includes a Next.js dashboard for the SK hynix ADR parity monitor. It reads the existing `premium_history.csv` on the server and can request a live snapshot from Yahoo Finance using the same calculations as `adr_lens.py`.

```bash
npm run dev
```

The dashboard runs on port 5000. The original Python implementation and the GitHub Actions workflow remain available unchanged:

```bash
python adr_lens.py
```
