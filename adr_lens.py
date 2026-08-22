import json
import urllib.request


ADR_RATIO = 10


def get_price(symbol):
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/"
        f"{symbol}?interval=1d&range=5d"
    )

    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0"}
    )

    with urllib.request.urlopen(request) as response:
        data = json.loads(response.read())

    result = data["chart"]["result"][0]
    return result["meta"]["regularMarketPrice"]


def calculate_parity(foreign_price, fx_rate, adr_ratio):
    return foreign_price / fx_rate / adr_ratio


def calculate_premium(adr_price, parity):
    return ((adr_price / parity) - 1) * 100


# Pull latest market data
skhy_price = get_price("SKHY")
krx_price = get_price("000660.KS")
usd_krw = get_price("KRW=X")

parity = calculate_parity(
    krx_price,
    usd_krw,
    ADR_RATIO
)

premium = calculate_premium(
    skhy_price,
    parity
)


print("ADR Lens - SK hynix")
print("--------------------")
print(f"SKHY:        ${skhy_price:,.2f}")
print(f"KRX 000660:  KRW {krx_price:,.0f}")
print(f"USD/KRW:     {usd_krw:,.2f}")
print(f"ADR parity:  ${parity:,.2f}")
print(f"ADR premium: {premium:+.2f}%")