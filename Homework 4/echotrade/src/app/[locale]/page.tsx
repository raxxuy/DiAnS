import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("Home");
  const locale = useLocale();

  const features = [
    {
      title: t("features.card1"),
      description: t("features.card1Description"),
      icon: "📊",
      gradient: "from-blue-500 to-cyan-500",
      href: `/${locale}/market-data`,
      shadow: "hover:shadow-blue-500/25"
    },
    {
      title: t("features.card2"),
      description: t("features.card2Description"),
      icon: "🤖",
      gradient: "from-purple-500 to-pink-500",
      href: `/${locale}/predictions`,
      shadow: "hover:shadow-purple-500/25"
    },
    {
      title: t("features.card3"),
      description: t("features.card3Description"),
      icon: "⚡",
      gradient: "from-amber-500 to-orange-500",
      href: `/${locale}/news`,
      shadow: "hover:shadow-amber-500/25"
    }
  ];

  const links = [
    {
      title: t("footer.about"),
      href: `/${locale}/about`
    },
    {
      title: t("footer.marketData"),
      href: `/${locale}/market-data`
    },
    {
      title: t("footer.predictions"),
      href: `/${locale}/predictions`
    },
    {
      title: t("footer.news"),
      href: `/${locale}/news`
    }
  ]

  return (
    <div className="w-full min-h-screen font-[family-name:var(--font-roboto)] bg-zinc-900">
      <main>
        <div className="w-full px-8 md:px-20 py-24 md:py-36">
          <div className="flex flex-col md:flex-row w-full gap-8 md:gap-16 items-center">
            <div className="w-full md:w-1/2 h-96 bg-zinc-800/50 rounded-2xl shadow-2xl backdrop-blur-md border border-zinc-700/30 hover:border-zinc-600/50 transition-all duration-300 hover:shadow-emerald-500/10 hover:scale-[1.02] group">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 400 300"
                className="p-8"
              >
                {[...Array(6)].map((_, i) => (
                  <line
                    key={`grid-${i}`}
                    x1="0"
                    y1={50 + i * 40}
                    x2="400"
                    y2={50 + i * 40}
                    stroke="#444"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                    className="group-hover:stroke-zinc-600 transition-colors duration-300"
                  />
                ))}

                <path
                  d="M 50 250 Q 150 200, 200 150 T 350 50"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  className="trending-arrow"
                />

                <polygon
                  points="350,50 340,65 360,65"
                  fill="#22c55e"
                  transform="rotate(-45, 340, 50)"
                  className="trending-arrow"
                />

                <path
                  d="M 50 250 Q 150 200, 200 150 T 350 50 L 350 250 L 50 250"
                  fill="url(#gradient)"
                  opacity="0.2"
                  className="group-hover:opacity-30 transition-opacity duration-300"
                />

                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center gap-8">
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7779ff] via-[#bf65fb] to-[#f350fd] transition-all">EchoTrade</span>
              </h1>
              <p className="text-zinc-300 text-lg md:text-xl leading-relaxed backdrop-blur-sm">
                {t("main.description1")}
                <span className="font-bold text-2xl">{t("main.span")}</span>,
                {t("main.description2")}
              </p>
              <div className="flex gap-4 mt-4">
                <Link href={`/${locale}/market-data`}>
                  <button className="primary-button">
                    {t("main.getStarted")}
                  </button>
                </Link>
                <Link href={`/${locale}/about`}>
                  <button className="secondary-button">
                    {t("main.learnMore")}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="px-8 md:px-20 py-24 md:py-36 bg-zinc-800/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            {t("features.title")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group p-8 bg-zinc-900/50 rounded-xl border border-zinc-700/30 hover:border-zinc-600/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${feature.shadow}`}
              >
                <div className="text-5xl mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:animate-bounce">
                  {feature.icon}
                </div>

                <h3 className={`text-xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r ${feature.gradient} transition-all duration-500 group-hover:scale-105`}>
                  {feature.title}
                </h3>

                <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-500">
                  {feature.description}
                </p>

                <div className="mt-4 text-zinc-500 group-hover:text-zinc-400 transition-colors duration-500">
                  <Link href={feature.href} className="flex items-center gap-2">
                    <span className="text-sm">{t("features.learnMore")}</span>
                    <svg
                      className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="w-full py-8 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-zinc-400">{t("footer.copyright")}</div>
          <div className="flex gap-6">
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-zinc-400 hover:text-white transition-colors duration-300"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
