"""
ADR Lens V4
Live market-data prototype.

Pulls:
- SKHY ADR price
- SK hynix 000660.KS price
- USD/KRW exchange rate

Then calculates ADR parity + premium/discount
and stores observations in premium_history.csv.
"""

import csv
import json
import os
from datetime import datetime, timezone
from urllib.request import Request, urlopen


ADR_SYMBOL = "SKHY"
FOREIGN_SYMBOL = "000660.KS"
FX_SYMBOL = "KRW=X"

# 10 SKHY ADRs = 1 Korean SK hynix common share
ADR_RATIO = 10

HISTORY_FILE = "premium_history.csv"


def get_yahoo_price(symbol):
    url = (
        "https://query1.finance.yahoo.com/v8/finance/chart/"
        + symbol
        + "?interval=1m&range=1d"
    )

    request = Request(
        url,
        headers={"User-Agent": "Mozilla/5.0"}
    )

    with urlopen(request, timeout=10) as response:
        data = json.loads(response.read().decode())

    result = data["chart"]["result"][0]

    closes = result["indicators"]["quote"][0]["close"]

    valid_prices = [
        price for price in closes
        if price is not None
    ]

    if valid_prices:
        return float(valid_prices[-1])

    return float(result["meta"]["regularMarketPrice"])


def calculate_parity(foreign_price, usd_krw, adr_ratio):
    # 10 ADRs = 1 Korean common share
    return foreign_price / usd_krw / adr_ratio


def calculate_premium(adr_price, parity):
    return ((adr_price / parity) - 1) * 100


def load_previous_premium():
    if not os.path.exists(HISTORY_FILE):
        return None

    try:
        with open(HISTORY_FILE, "r", newline="") as file:
            rows = list(csv.DictReader(file))

        if not rows:
            return None

        return float(rows[-1]["premium"])

    except Exception:
        return None


def save_observation(
    adr_price,
    foreign_price,
    usd_krw,
    parity,
    premium
):
    file_exists = os.path.exists(HISTORY_FILE)

    with open(HISTORY_FILE, "a", newline="") as file:
        writer = csv.writer(file)

        if not file_exists:
            writer.writerow([
                "timestamp",
                "skhy",
                "krx_000660",
                "usd_krw",
                "parity",
                "premium"
            ])

        writer.writerow([
            datetime.now(timezone.utc).isoformat(),
            round(adr_price, 4),
            round(foreign_price, 2),
            round(usd_krw, 4),
            round(parity, 4),
            round(premium, 4)
        ])


def main():
    print("ADR Lens V4")
    print("Fetching market data...")
    print()

    try:
        skhy_price = get_yahoo_price(ADR_SYMBOL)
        krx_price = get_yahoo_price(FOREIGN_SYMBOL)
        usd_krw = get_yahoo_price(FX_SYMBOL)

    except Exception as error:
        print("MARKET DATA ERROR:")
        print(error)
        return

    parity = calculate_parity(
        krx_price,
        usd_krw,
        ADR_RATIO
    )

    premium = calculate_premium(
        skhy_price,
        parity
    )

    previous_premium = load_previous_premium()

    print("ADR Lens - SK hynix")
    print("------------------------------")
    print(f"SKHY:        ${skhy_price:,.2f}")
    print(f"KRX 000660:  KRW {krx_price:,.0f}")
    print(f"USD/KRW:     {usd_krw:,.2f}")
    print(f"ADR parity:  ${parity:,.2f}")
    print(f"ADR premium: {premium:+.2f}%")

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

        print(
            f"Premium change: "
            f"{change:+.2f} percentage points "
            f"({status})"
        )

    save_observation(
        skhy_price,
        krx_price,
        usd_krw,
        parity,
        premium
    )

    print()
    print("Observation saved to premium_history.csv")


if __name__ == "__main__":
    main()