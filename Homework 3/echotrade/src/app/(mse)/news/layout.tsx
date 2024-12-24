import { Metadata } from "next";

export const metadata: Metadata = {
  title: "EchoTrade - Latest Market News",
  description: "Latest news from the Macedonian Stock Exchange",
};

export default function NewsLayout({ 
  children,
}: { 
  children: React.ReactNode
}) {
  return <div>{children}</div>;
}