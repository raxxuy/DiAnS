import { Metadata } from "next";

export const metadata: Metadata = {
  title: "EchoTrade - Market Data",
  description: "Explore the Macedonian Stock Exchange market data and insights",
};

export default function MarketDataLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}