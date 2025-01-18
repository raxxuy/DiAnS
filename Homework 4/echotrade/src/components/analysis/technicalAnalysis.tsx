"use client"

import { issuer } from "@prisma/client";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";

export type TechnicalAnalysis = {
  oscillators: OscillatorAnalysis;
  moving_averages: MovingAverageAnalysis;
}

export type MovingAverageAnalysis = {
  ema: IndicatorWithPeriods;
  sma: IndicatorWithPeriods;
  wma: IndicatorWithPeriods;
  dema: IndicatorWithPeriods;
  wema: IndicatorWithPeriods;
};

export type OscillatorAnalysis = {
  cci: IndicatorWithPeriods;
  rsi: IndicatorWithPeriods;
  macd: IndicatorWithPeriods;
  stochastic: IndicatorWithPeriods;
  williamsR: IndicatorWithPeriods;
};

export type IndicatorWithPeriods = {
  name: string;
  daily: number;
  weekly: number;
  monthly: number;
  signal: 'buy' | 'sell' | 'hold';
};

const apiUrl = process.env.API_URL || "http://localhost:5000";

export default function TechnicalAnalysis({ selectedIssuer }: { selectedIssuer?: issuer }) {
  const t = useTranslations("TechnicalAnalysis");
  const locale = useLocale();
  
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedIssuer) {
      setTechnicalIndicators(null);
      return;
    }

    setIsLoading(true);
    fetch(`${apiUrl}/api/analysis/technical?issuer_id=${selectedIssuer.id}`)
      .then(res => res.json())
      .then((data) => setTechnicalIndicators(data))
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
      {technicalIndicators ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">{t("oscillators")}</h3>
            <div className="space-y-4">
              {Object.entries(technicalIndicators.oscillators).map(([key, indicator]) => (
                <div key={key} className="p-4 bg-zinc-800 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{indicator.name}</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        indicator.signal === "buy" ? "bg-green-500/20 text-green-400" :
                        indicator.signal === "sell" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {indicator.signal.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-zinc-400">{t("daily")}</div>
                        <div>{indicator.daily.toLocaleString(locale === "mk" ? "mk-MK" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400">{t("weekly")}</div>
                        <div>{indicator.weekly.toLocaleString(locale === "mk" ? "mk-MK" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400">{t("monthly")}</div>
                        <div>{indicator.monthly.toLocaleString(locale === "mk" ? "mk-MK" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">{t("movingAverages")}</h3>
            <div className="space-y-4">
              {Object.entries(technicalIndicators.moving_averages).map(([key, indicator]) => (
                  <div key={key} className="p-4 bg-zinc-800 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{indicator.name}</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        indicator.signal === "buy" ? "bg-green-500/20 text-green-400" :
                        indicator.signal === "sell" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {indicator.signal.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-zinc-400">{t("daily")}</div>
                        <div>{indicator.daily.toLocaleString(locale === "mk" ? "mk-MK" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400">{t("weekly")}</div>
                        <div>{indicator.weekly.toLocaleString(locale === "mk" ? "mk-MK" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400">{t("monthly")}</div>
                        <div>{indicator.monthly.toLocaleString(locale === "mk" ? "mk-MK" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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