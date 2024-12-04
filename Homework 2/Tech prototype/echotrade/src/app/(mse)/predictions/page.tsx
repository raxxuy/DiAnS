"use client";

import { issuer } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

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

function calculateTechnicalIndicators(): TechnicalIndicator[] {
  // Simulated technical indicators data
  const oscillators: TechnicalIndicator[] = [
    {
      name: "RSI",
      type: "oscillator",
      values: { daily: 65.4, weekly: 58.2, monthly: 52.1 },
      signal: "sell"
    },
    {
      name: "MACD",
      type: "oscillator",
      values: { daily: 0.82, weekly: 0.45, monthly: 0.12 },
      signal: "buy"
    },
    {
      name: "Stochastic",
      type: "oscillator",
      values: { daily: 82.3, weekly: 75.6, monthly: 68.9 },
      signal: "sell"
    },
    {
      name: "CCI",
      type: "oscillator",
      values: { daily: 125.4, weekly: 98.7, monthly: 85.3 },
      signal: "hold"
    },
    {
      name: "Williams %R",
      type: "oscillator",
      values: { daily: -25.6, weekly: -35.2, monthly: -42.8 },
      signal: "buy"
    }
  ];

  const movingAverages: TechnicalIndicator[] = [
    {
      name: "SMA (20)",
      type: "ma",
      values: { daily: 152.34, weekly: 148.92, monthly: 145.67 },
      signal: "buy"
    },
    {
      name: "EMA (50)",
      type: "ma",
      values: { daily: 149.87, weekly: 146.23, monthly: 143.56 },
      signal: "hold"
    },
    {
      name: "WMA",
      type: "ma",
      values: { daily: 151.23, weekly: 147.89, monthly: 144.56 },
      signal: "buy"
    },
    {
      name: "VWMA",
      type: "ma",
      values: { daily: 150.67, weekly: 147.34, monthly: 144.12 },
      signal: "sell"
    },
    {
      name: "HMA",
      type: "ma",
      values: { daily: 153.45, weekly: 149.78, monthly: 146.23 },
      signal: "hold"
    }
  ];

  return [...oscillators, ...movingAverages];
};

function PredictionsContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [issuers, setIssuers] = useState<issuer[]>([]);
  const [selectedIssuer, setSelectedIssuer] = useState<issuer>();
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicator[]>([]);

  useEffect(() => {
    fetch("/api/issuers")
      .then(res => res.json())
      .then(data => {
        setIssuers(data.sort((a: issuer, b: issuer) => a.code.localeCompare(b.code)));
        setSelectedIssuer(code ? data.find((i: issuer) => i.code === code) : undefined);
      });
  }, [code]);

  useEffect(() => {
    if (selectedIssuer) {
      const indicators = calculateTechnicalIndicators();
      setTechnicalIndicators(indicators);
    }
  }, [selectedIssuer]);

  return (
    <div className="w-full min-h-screen bg-zinc-900 text-white px-6 md:px-20 py-12">
      <h1 className="predictions-header">
        Stock Predictions
      </h1>
      <p className="predictions-subheader"> 
        Predict the future of stocks with technical analysis and fundamental analysis
      </p>
      <div className="mb-8">
        <select
          className="select-md"
          value={selectedIssuer?.code || ""}
          onChange={(e) => setSelectedIssuer(issuers.find((i) => i.code === e.target.value))}
        >
          <option value="">Select an issuer</option>
          {issuers.map((issuer) => (
            <option key={issuer.id} value={issuer.code}>{issuer.code}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
          <h2 className="text-2xl font-bold mb-4">Technical Analysis</h2>
          {selectedIssuer ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Oscillators</h3>
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
                            <div className="text-zinc-400">Daily</div>
                            <div>{indicator.values.daily.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-zinc-400">Weekly</div>
                            <div>{indicator.values.weekly.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-zinc-400">Monthly</div>
                            <div>{indicator.values.monthly.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Moving Averages</h3>
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
                            <div className="text-zinc-400">Daily</div>
                            <div>{indicator.values.daily.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-zinc-400">Weekly</div>
                            <div>{indicator.values.weekly.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-zinc-400">Monthly</div>
                            <div>{indicator.values.monthly.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-zinc-400">Select an issuer to view technical analysis</p>
          )}
        </div>
        <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
          <h2 className="text-2xl font-bold mb-4">Fundamental Analysis</h2>
          <p className="text-zinc-400">Coming soon</p>
        </div>
        <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
          <h2 className="text-2xl font-bold mb-4">LSTM Prediction</h2>
          <p className="text-zinc-400">Coming soon</p>
        </div>
      </div>
    </div>
  );
}

export default function Predictions() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PredictionsContent />
    </Suspense>
  );
}
