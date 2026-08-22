import { calculateParity, calculatePremium, getInitialMarketData, SYMBOLS } from "../../../lib/market-data";

async function getYahooPrice(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance returned ${response.status}`);
  }

  const data = await response.json();
  const result = data?.chart?.result?.[0];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const validPrices = closes.filter((price) => price !== null);
  const price = validPrices.at(-1) ?? result?.meta?.regularMarketPrice;

  if (!Number.isFinite(price)) throw new Error(`No price returned for ${symbol}`);
  return Number(price);
}

export async function GET() {
  try {
    const [adrPrice, foreignPrice, usdKrw] = await Promise.all([
      getYahooPrice(SYMBOLS.adr),
      getYahooPrice(SYMBOLS.foreign),
      getYahooPrice(SYMBOLS.fx)
    ]);
    const parity = calculateParity(foreignPrice, usdKrw);
    const premium = calculatePremium(adrPrice, parity);
    const stored = getInitialMarketData();

    return Response.json({
      snapshot: {
        adrPrice,
        foreignPrice,
        usdKrw,
        parity,
        premium,
        timestamp: new Date().toISOString(),
        source: "Yahoo Finance"
      },
      previousPremium: stored.snapshot?.premium ?? null,
      history: stored.history,
      isLive: true
    });
  } catch (error) {
    return Response.json(
      {
        ...getInitialMarketData(),
        error: "Live market data is temporarily unavailable."
      },
      { status: 503 }
    );
  }
}