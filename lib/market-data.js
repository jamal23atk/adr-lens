import fs from "node:fs";
import path from "node:path";

const HISTORY_FILE = path.join(process.cwd(), "premium_history.csv");

export const ADR_RATIO = 10;
export const SYMBOLS = {
  adr: "SKHY",
  foreign: "000660.KS",
  fx: "KRW=X"
};

export function calculateParity(foreignPrice, usdKrw) {
  return foreignPrice / usdKrw / ADR_RATIO;
}

export function calculatePremium(adrPrice, parity) {
  return (adrPrice / parity - 1) * 100;
}

function parseCsvLine(line) {
  return line.split(",").map((value) => value.trim());
}

export function readHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return [];

  try {
    const lines = fs.readFileSync(HISTORY_FILE, "utf8").trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0]);
    return lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      return Object.fromEntries(
        headers.map((header, index) => [
          header,
          header === "timestamp" ? values[index] : Number(values[index])
        ])
      );
    }).filter((row) => Number.isFinite(row.premium));
  } catch {
    return [];
  }
}

export function getInitialMarketData() {
  const history = readHistory();
  const latest = history.at(-1);

  return {
    snapshot: latest
      ? {
          adrPrice: latest.skhy,
          foreignPrice: latest.krx_000660,
          usdKrw: latest.usd_krw,
          parity: latest.parity,
          premium: latest.premium,
          timestamp: latest.timestamp,
          source: "premium_history.csv"
        }
      : null,
    previousPremium: history.length > 1 ? history.at(-2).premium : null,
    history: history.slice(-24),
    isLive: false
  };
}