import type { Metadata } from "next";
import localFont from "next/font/local";
import { Montserrat, Raleway, Roboto } from "next/font/google";
import NavBar from "@/components/navBar";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const roboto = Roboto({
  weight: "400",
  variable: "--font-roboto",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  weight: "400",
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const raleway = Raleway({
  weight: "400",
  variable: "--font-raleway",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EchoTrade - Macedonian Stock Exchange Insights",
  description: "Gain real-time insights and predictive analytics for the Macedonian Stock Exchange",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} ${montserrat.variable} ${raleway.variable} antialiased`}
      >
        <NavBar />
        {children}
      </body>
    </html>
  );
}
