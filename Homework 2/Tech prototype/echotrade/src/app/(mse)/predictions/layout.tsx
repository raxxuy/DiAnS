import { Metadata } from "next";

export const metadata: Metadata = {
  title: "EchoTrade - Predictions",
  description: "Predict future stock prices and trends on the Macedonian Stock Exchange"
};

export default function PredictionsLayout({ 
  children,
}: {
  children: React.ReactNode
}) {
  return <div>{children}</div>;
}
