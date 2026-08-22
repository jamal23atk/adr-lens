import Dashboard from "./dashboard";
import { getInitialMarketData } from "../lib/market-data";

export const dynamic = "force-dynamic";

export default function Home() {
  return <Dashboard initialData={getInitialMarketData()} />;
}