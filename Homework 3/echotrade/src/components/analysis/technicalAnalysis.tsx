"use client"

import { issuer } from "@prisma/client";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";

interface TechnicalIndicator {
  name: string;
  type: "oscillator" | "ma";
  values: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  signal: "buy" | "sell" | "hold";
}

export default function TechnicalAnalysis({ selectedIssuer }: { selectedIssuer?: issuer }) {
  const t = useTranslations("TechnicalAnalysis");
  const locale = useLocale();
  
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicator[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedIssuer) {
      setTechnicalIndicators([]);
      return;
    }

    setIsLoading(true);
    fetch(`/api/predictions/technical?issuer_id=${selectedIssuer.id}`)
      .then(res => res.json())
      .then(data => setTechnicalIndicators(data))
      .catch(err => console.error(err))
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
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
      <h2 className="text-2xl font-bold mb-4">{t("title")}</h2>
      {technicalIndicators.length > 0 ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">{t("oscillators")}</h3>
            <div className="space-y-4">
              {technicalIndicators
                .filter(i => i.type === "oscillator")
                .map(indicator => (
                  <div key={indicator.name} className="p-4 bg-zinc-800 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{indicator.name}</span>
                      <span className={`px-2 py-1 rounded text-sm ${indicator.signal === "buy" ? "bg-green-500/20 text-green-400" :
                        indicator.signal === "sell" ? "bg-red-500/20 text-red-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }`}>
                        {indicator.signal.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-zinc-400">{t("daily")}</div>
                        <div>{indicator.values.daily.toLocaleString(locale === "mk" ? "mk-MK" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400">{t("weekly")}</div>
                        <div>{indicator.values.weekly.toLocaleString(locale === "mk" ? "mk-MK" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400">{t("monthly")}</div>
                        <div>{indicator.values.monthly.toLocaleString(locale === "mk" ? "mk-MK" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">{t("movingAverages")}</h3>
            <div className="space-y-4">
              {technicalIndicators
                .filter(i => i.type === "ma")
                .map(indicator => (
                  <div key={indicator.name} className="p-4 bg-zinc-800 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{indicator.name}</span>
                      <span className={`px-2 py-1 rounded text-sm ${indicator.signal === "buy" ? "bg-green-500/20 text-green-400" :
                        indicator.signal === "sell" ? "bg-red-500/20 text-red-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }`}>
                        {indicator.signal.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-zinc-400">{t("daily")}</div>
                        <div>{indicator.values.daily.toLocaleString(locale === "mk" ? "mk-MK" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400">{t("weekly")}</div>
                        <div>{indicator.values.weekly.toLocaleString(locale === "mk" ? "mk-MK" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400">{t("monthly")}</div>
                        <div>{indicator.values.monthly.toLocaleString(locale === "mk" ? "mk-MK" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-zinc-400">
          {t("notEnoughData")}
        </p>
      )}
    </div>
  );
}