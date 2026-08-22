"use client";

import { useMemo, useState } from "react";

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="3" width="6" height="6" rx="1" /><rect x="3" y="15" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h17" /><path d="m7 15 4-4 3 2 5-7" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    sliders: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="10" cy="18" r="2" /></>,
    refresh: <><path d="M20 11a8.1 8.1 0 0 0-14.8-3L3 11" /><path d="M3 5v6h6" /><path d="M4 13a8.1 8.1 0 0 0 14.8 3L21 13" /><path d="M21 19v-6h-6" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    external: <><path d="M14 4h6v6" /><path d="m20 4-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>
  };

  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function formatCurrency(value, currency = "USD", digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function formatTime(timestamp) {

  if (!timestamp) return "No observation yet";

  const date = new Date(timestamp);

  const parts = new Intl.DateTimeFormat("en-US", {

    month: "short",

    day: "numeric",

    hour: "numeric",

    minute: "2-digit",

    hour12: true,

    timeZone: "America/Los_Angeles",

  }).formatToParts(date);

  const get = (type) =>

    parts.find((part) => part.type === type)?.value || "";

  return `${get("month")} ${get("day")} at ${get("hour")}:${get(

    "minute"

  )} ${get("dayPeriod")}`;

}

function StatCard({ label, value, subtext, accent = false, icon }) {
  return (
    <article className={`stat-card ${accent ? "stat-card-accent" : ""}`}>
      <div className="stat-card-top">
        <span>{label}</span>
        <span className="stat-icon"><Icon name={icon} size={16} /></span>
      </div>
      <strong>{value}</strong>
      <small>{subtext}</small>
    </article>
  );
}

function PremiumChart({ history, current }) {
  const values = history.map((item) => item.premium).filter(Number.isFinite);
  if (current && (values.length === 0 || current.timestamp !== history.at(-1)?.timestamp)) values.push(current.premium);
  const points = values.length ? values : [0];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || Math.max(Math.abs(max) * 0.08, 1);
  const width = 640;
  const height = 220;
  const chartPoints = points.map((value, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
    const y = height - ((value - (min - range * 0.14)) / (range * 1.28)) * height;
    return `${x},${Math.max(12, Math.min(height - 12, y))}`;
  }).join(" ");
  const areaPoints = `0,${height} ${chartPoints} ${width},${height}`;

  return (
    <div className="chart-wrap">
      <div className="chart-axis-labels"><span>{formatNumber(max, 2)}%</span><span>{formatNumber(min, 2)}%</span></div>
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Premium history chart">
        <defs>
          <linearGradient id="premiumFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity=".22" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="55" x2={width} y2="55" className="chart-grid" />
        <line x1="0" y1="110" x2={width} y2="110" className="chart-grid" />
        <line x1="0" y1="165" x2={width} y2="165" className="chart-grid" />
        <polygon points={areaPoints} fill="url(#premiumFill)" />
        <polyline points={chartPoints} className="chart-line" />
        {points.map((value, index) => {
          const [x, y] = chartPoints.split(" ")[index].split(",");
          return <circle key={`${value}-${index}`} cx={x} cy={y} r="4" className="chart-dot" />;
        })}
      </svg>
      <div className="chart-dates">
        <span>{history.length ? formatTime(history[0].timestamp) : "Start"}</span>
        <span>{current ? formatTime(current.timestamp) : "Latest"}</span>
      </div>
    </div>
  );
}

export default function Dashboard({ initialData }) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notice, setNotice] = useState("");
  const { snapshot, previousPremium } = data;
  const premiumChange = snapshot && Number.isFinite(previousPremium)
    ? snapshot.premium - previousPremium
    : null;
  const marketStatus = premiumChange === null ? "Above parity" : premiumChange > 0 ? "Expanding" : premiumChange < 0 ? "Compressing" : "Unchanged";
  const statusClass = marketStatus === "Compressing" ? "negative" : "positive";

  const tableRows = useMemo(() => {
    const rows = [...data.history];
    if (snapshot && rows.at(-1)?.timestamp !== snapshot.timestamp) rows.push(snapshot);
    return rows.slice(-5).reverse();
  }, [data.history, snapshot]);

  async function refreshMarket() {
    setIsRefreshing(true);
    setNotice("");
    try {
      const response = await fetch("/api/market", { cache: "no-store" });
      const result = await response.json();
      setData(result);
      if (!response.ok) setNotice(result.error || "Unable to refresh live data.");
      else setNotice("Live market data synced.");
    } catch {
      setNotice("Live market data is temporarily unavailable.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><span /><span /><span /></div>
          <div><strong>ADR<span>·</span>LENS</strong><small>MARKET INTELLIGENCE</small></div>
        </div>
        <div className="sidebar-section-label">Workspace</div>
        <nav className="main-nav" aria-label="Main navigation">
          <button className="nav-item active"><Icon name="grid" />Overview</button>
          <button className="nav-item"><Icon name="chart" />Performance</button>
          <button className="nav-item"><Icon name="clock" />Observations</button>
        </nav>
        <div className="sidebar-section-label">Monitor</div>
        <div className="watchlist-card">
          <div className="watchlist-title"><span className="status-dot" />Live watchlist</div>
          <div className="watchlist-symbol"><strong>SKHY</strong><span>SK hynix ADR</span><b>{snapshot ? `${snapshot.premium >= 0 ? "+" : ""}${snapshot.premium.toFixed(2)}%` : "—"}</b></div>
          <div className="watchlist-symbol muted"><strong>000660.KS</strong><span>Underlying</span><b>KRX</b></div>
        </div>
        <div className="sidebar-bottom">
          <div className="method-note"><span className="note-icon"><Icon name="info" size={15} /></span><div><strong>Parity monitor</strong><p>10 ADRs represent 1 Korean common share.</p></div></div>
          <div className="sidebar-user"><div className="avatar">AL</div><div><strong>ADR Lens</strong><small>Personal workspace</small></div><span>•••</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Markets</span><Icon name="arrow" size={14} /><span>Parity monitor</span><Icon name="arrow" size={14} /><strong>SK hynix</strong></div>
          <div className="topbar-actions"><span className="market-open"><i />Market data connected</span><button className="icon-button" aria-label="Settings"><Icon name="sliders" size={18} /></button></div>
        </header>

        <div className="page-body">
          <section className="page-heading">
            <div><p className="eyebrow">REAL-TIME DISLOCATION MONITOR</p><h1>SK hynix <span>/</span> ADR parity</h1><p className="heading-subtitle">Compare U.S. ADR pricing against its Korean underlying, adjusted for FX.</p></div>
            <div className="heading-actions"><span className="sync-label"><span className="sync-dot" />{data.isLive ? "Live from Yahoo Finance" : "Stored observation"}<small>{snapshot ? `Updated ${formatTime(snapshot.timestamp)}` : ""}</small></span><button className="refresh-button" onClick={refreshMarket} disabled={isRefreshing}><Icon name="refresh" size={16} />{isRefreshing ? "Syncing…" : "Refresh data"}</button></div>
          </section>
          {notice && <div className={`notice ${notice.includes("unavailable") ? "notice-warning" : ""}`}>{notice}</div>}

          <section className="hero-grid">
            <article className="premium-hero">
              <div className="hero-topline"><div><span className="live-pill"><i />PRIMARY SIGNAL</span><h2>ADR premium</h2></div><span className={`status-badge ${statusClass}`}>{marketStatus}<span>↗</span></span></div>
              <div className="premium-value">{snapshot ? `${snapshot.premium >= 0 ? "+" : ""}${snapshot.premium.toFixed(2)}` : "—"}<span>%</span></div>
              <p className="premium-caption">{snapshot ? `The ADR is trading ${snapshot.premium >= 0 ? "above" : "below"} its FX-adjusted parity value.` : "Run a data refresh to load the market signal."}</p>
              <div className="hero-footer"><div><span>IMPLIED PARITY</span><strong>{formatCurrency(snapshot?.parity)}</strong></div><div><span>OBSERVATION</span><strong>{formatTime(snapshot?.timestamp)}</strong></div><div><span>ADR RATIO</span><strong>10 : 1</strong></div></div>
            </article>
            <article className="chart-card">
              <div className="card-heading"><div><span className="eyebrow">SIGNAL HISTORY</span><h2>Premium over time</h2></div><button className="more-button">1D <span>⌄</span></button></div>
              <PremiumChart history={data.history} current={data.isLive ? snapshot : null} />
            </article>
          </section>

          <section className="stats-grid">
            <StatCard label="SKHY · ADR" value={formatCurrency(snapshot?.adrPrice)} subtext="U.S. listing · USD" accent icon="chart" />
            <StatCard label="000660.KS · UNDERLYING" value={snapshot ? `₩${formatNumber(snapshot.foreignPrice, 0)}` : "—"} subtext="Korea Exchange · KRW" icon="chart" />
            <StatCard label="USD / KRW" value={formatNumber(snapshot?.usdKrw)} subtext="Spot exchange rate" icon="refresh" />
            <StatCard label="PREMIUM CHANGE" value={premiumChange === null ? "First read" : `${premiumChange >= 0 ? "+" : ""}${premiumChange.toFixed(2)} pp`} subtext={premiumChange === null ? "No prior observation" : "Since last observation"} icon="arrow" />
          </section>

          <section className="lower-grid">
            <article className="table-card">
              <div className="card-heading"><div><span className="eyebrow">AUDIT TRAIL</span><h2>Latest observations</h2></div><button className="text-button">View history <Icon name="arrow" size={14} /></button></div>
              <div className="table-scroll"><table><thead><tr><th>Timestamp</th><th>ADR</th><th>Parity</th><th>Premium</th><th>Signal</th></tr></thead><tbody>
                {tableRows.length ? tableRows.map((row) => <tr key={row.timestamp}><td>{formatTime(row.timestamp)}</td><td>{formatCurrency(row.adrPrice ?? row.skhy)}</td><td>{formatCurrency(row.parity)}</td><td className={(row.premium >= 0 ? "table-positive" : "table-negative")}>{row.premium >= 0 ? "+" : ""}{row.premium.toFixed(2)}%</td><td><span className="table-signal"><i />Tracked</span></td></tr>) : <tr><td colSpan="5" className="empty-state">No saved observations yet.</td></tr>}
              </tbody></table></div>
            </article>
            <article className="formula-card">
              <div className="formula-orbit"><div className="orbit-core">≈</div><span className="orbit-dot one" /><span className="orbit-dot two" /><span className="orbit-dot three" /></div>
              <span className="eyebrow">HOW IT WORKS</span><h2>Parity, made visible.</h2><p>We translate the Korean share price into USD, account for the ADR ratio, then measure the gap to the live ADR price.</p>
              <div className="formula">Parity = <span>KRX price</span> ÷ <span>USD/KRW</span> ÷ <span>10</span></div>
              <button className="text-button">Read methodology <Icon name="external" size={14} /></button>
            </article>
          </section>
          <footer className="page-footer"><span>ADR LENS <b>·</b> Pricing intelligence for cross-listed assets</span><span>Source: Yahoo Finance <b>·</b> Refresh manually for latest prices</span></footer>
        </div>
      </main>
    </div>
  );
}