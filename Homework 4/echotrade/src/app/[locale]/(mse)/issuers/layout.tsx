import { Metadata } from "next";

export const metadata: Metadata = {
  title: "EchoTrade - Issuers",
  description: "Explore the Macedonian Stock Exchange issuers and their companies",
};

export default function IssuersLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}