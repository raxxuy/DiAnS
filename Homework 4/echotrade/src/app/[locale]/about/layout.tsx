import { Metadata } from "next";

export const metadata: Metadata = {
  title: "EchoTrade - About",
  description: "About EchoTrade",
};

export default function AboutLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <div>{children}</div>
}