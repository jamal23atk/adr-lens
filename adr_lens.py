"""
ADR Lens

Calculates the FX-adjusted parity and premium/discount
between a U.S. ADR and its foreign-listed underlying shares.

First implementation: SK hynix (SKHY / KRX: 000660)
"""


def calculate_parity(foreign_price, fx_rate, adr_ratio):
    return foreign_price / fx_rate / adr_ratio


def calculate_premium(adr_price, parity):
    return ((adr_price / parity) - 1) * 100


# SK hynix example data
skhy_price = 163.41
krx_price = 1_730_000
usd_krw = 1386.01
adr_ratio = 10

parity = calculate_parity(krx_price, usd_krw, adr_ratio)
premium = calculate_premium(skhy_price, parity)

print("ADR Lens — SK hynix")
print("--------------------")
print(f"SKHY:        ${skhy_price:,.2f}")
print(f"KRX 000660:  ₩{krx_price:,.0f}")
print(f"USD/KRW:     {usd_krw:,.2f}")
print(f"ADR parity:  ${parity:,.2f}")
print(f"ADR premium: {premium:+.2f}%")