import csv
import json
import os
import urllib.request
from datetime import datetime, timezone


ADR_RATIO = 10
HISTORY_FILE = "premium_history.csv"


def get_price(symbol):
    url = (
        "https://query1.finance.yahoo.com/v8/finance/chart/"
        f"{symbol}?interval=1d&range=5d"
    )

    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0"}
    )

    with urllib.request.urlopen(request, timeout=10) as response:
        data = json.loads(response.read())

    result = data["chart"]["result"][0]
    return float(result["meta"]["regularMarketPrice"])


def calculate_parity(foreign_price, fx_rate, adr_ratio):
    return foreign_price / fx_rate / adr_ratio


def calculate_premium(adr_price, parity):
    return ((adr_price / parity) - 1) * 100


def get_previous_premium():
    if not os.path.exists(HISTORY_FILE):
        return None

    with open(HISTORY_FILE, "r", newline="") as file:
        rows = list(csv.DictReader(file))

    if not rows:
        return None

    return float(rows[-1]["premium"])


def save_observation(
    timestamp,
    adr_price,
    foreign_price,
    fx_rate,
    parity,
    premium
):
    file_exists = os.path.exists(HISTORY_FILE)

    with open(HISTORY_FILE, "a", newline="") as file:
        fieldnames = [
            "timestamp",
            "skhy",
            "krx_000660",
            "usd_krw",
            "parity",
            "premium"
        ]

        writer = csv.DictWriter(file, fieldnames=fieldnames)

        if not file_exists:
            writer.writeheader()

        writer.writerow({
            "timestamp": timestamp,
            "skhy": round(adr_price, 2),
            "krx_000660": round(foreign_price, 2),
            "usd_krw": round(fx_rate, 4),
            "parity": round(parity, 4),
            "premium": round(premium, 4)
        })


# Pull latest market data
skhy_price = get_price("SKHY")
krx_price = get_price("000660.KS")
usd_krw = get_price("KRW=X")

# Calculate parity and premium
parity = calculate_parity(
    krx_price,
    usd_krw,
    ADR_RATIO
)

premium = calculate_premium(
    skhy_price,
    parity
)

previous_premium = get_previous_premium()

timestamp = datetime.now(timezone.utc).isoformat()

save_observation(
    timestamp,
    skhy_price,
    krx_price,
    usd_krw,
    parity,
    premium
)

print()
print("ADR Lens - SK hynix")
print("--------------------")
print(f"SKHY:          ${skhy_price:,.2f}")
print(f"KRX 000660:    KRW {krx_price:,.0f}")
print(f"USD/KRW:       {usd_krw:,.2f}")
print(f"ADR parity:    ${parity:,.2f}")
print(f"ADR premium:   {premium:+.2f}%")

if previous_premium is None:
    print("Premium change: first observation")
else:
    change = premium - previous_premium

    if change < 0:
        status = "COMPRESSING"
    elif change > 0:
        status = "EXPANDING"
    else:
        status = "UNCHANGED"

    print(f"Previous:      {previous_premium:+.2f}%")
    print(f"Change:        {change:+.2f} percentage points")
    print(f"Status:        {status}")

print()