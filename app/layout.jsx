import "./globals.css";

export const metadata = {
  title: "ADR Lens — SK hynix parity monitor",
  description: "Real-time ADR parity, premium/discount, FX, and return attribution monitor."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}