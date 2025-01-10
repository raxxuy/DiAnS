"use client";

import { issuer } from "@prisma/client";
import { useEffect, useState } from "react";
import { SentimentAnalysis } from "@/lib/predictions/fundamental";
import { useTranslations, useLocale } from "next-intl";

const recommendationColors = {
  'STRONG BUY': 'text-green-400',
  'BUY': 'text-green-300',
  'HOLD': 'text-yellow-300',
  'SELL': 'text-red-300',
  'STRONG SELL': 'text-red-400',
};

export default function FundamentalAnalysis({ selectedIssuer }: { selectedIssuer?: issuer }) {
  const t = useTranslations("FundamentalAnalysis");
  const locale = useLocale();

  const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedIssuer) {
      setAnalysis(null);
      return;
    }

    setIsLoading(true);

    fetch(`/api/predictions/fundamental?issuer_id=${selectedIssuer.id}`)
      .then((res) => res.json())
      .then((data) => setAnalysis(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [selectedIssuer]);

  if (!selectedIssuer) {
    return (
      <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
        <h2 className="text-2xl font-bold mb-4">{t("title")}</h2>
        <p className="text-zinc-400">{t("description")}</p>
      </div>
    );
  }

  if (isLoading) {
    return (  
      <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
        <h2 className="text-2xl font-bold mb-4">{t("title")}</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
      <h2 className="text-2xl font-bold mb-4">{t("title")}</h2>
      {analysis ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">{t("newsSentiment")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-zinc-400">{t("sentimentScore")}</p>
                <p className="text-xl font-mono">
                  {analysis.sentiment !== undefined ? (
                    `${analysis.sentiment >= 0 ? '+' : ''}${analysis.sentiment.toFixed(3)}`
                  ) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-zinc-400">{t("recentNewsCount")}</p>
                <p className="text-xl font-mono">{analysis.newsCount ?? 0}</p>
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-zinc-400">{t("recommendation")}</p>
            <p className={`text-2xl font-bold ${recommendationColors[analysis.recommendation as keyof typeof recommendationColors]}`}>
              {analysis.recommendation}
            </p>
          </div>

          {analysis.latestDate && (
            <div className="text-sm text-zinc-500">
              {t("lastUpdated")}: {locale === "mk" ? 
              new Date(analysis.latestDate).toLocaleDateString("mk-MK").replace(" г.", "") 
              :  new Date(analysis.latestDate).toLocaleDateString()}
            </div>
          )}
        </div>
      ) : (
        <p className="text-zinc-400">{t("noSentimentData")}</p>
      )}
    </div>
  );
}
