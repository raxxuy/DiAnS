import localFont from "next/font/local";
import { Montserrat, Raleway, Roboto } from "next/font/google";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "../globals.css";
import NavBar from "@/components/navBar";

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

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>
}>) {
  const locale = (await params).locale;

  if (!routing.locales.includes(locale as "en" | "mk")) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} ${montserrat.variable} ${raleway.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <NavBar />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
