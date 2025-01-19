import { useTranslations } from "next-intl";

export default function AboutPage() {
  const t = useTranslations("About");

  return (
    <div className="w-full min-h-screen bg-zinc-900 text-white px-6 md:px-20 py-12">
      <h1 className="text-4xl font-bold mb-8">{t("title")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-zinc-600 transition-all duration-300">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400 mb-6">{t("vision")}</h2>
          <p className="text-zinc-300 leading-relaxed">
            {t("visionDescription")}
          </p>
        </div>

        <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-zinc-600 transition-all duration-300">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400 mb-6">{t("mission")}</h2>
          <p className="text-zinc-300 leading-relaxed">
            {t("missionDescription")}
          </p>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-3xl font-bold bg-clip-text text-center text-transparent bg-gradient-to-r from-indigo-400 to-violet-400 mb-8">{t("whyEchoTrade")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-zinc-600 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-4">{t("targetedMarket")}</h3>
            <p className="text-zinc-300 leading-relaxed">
              {t("targetedMarketDescription")}
            </p>
          </div>

          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-zinc-600 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-4">{t("advancedTools")}</h3>
            <p className="text-zinc-300 leading-relaxed">
              {t("advancedToolsDescription")}
            </p>
          </div>

          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-zinc-600 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-4">{t("realTimeInsights")}</h3>
            <p className="text-zinc-300 leading-relaxed">
              {t("realTimeInsightsDescription")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700">
        <p className="text-zinc-300 leading-relaxed text-center italic">
          {t("future")}
        </p>
      </div>
    </div>
  );
}