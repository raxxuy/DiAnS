"use client";

import { issuer } from "@prisma/client";
import { useEffect, useState } from "react";
import { SentimentAnalysis } from "@/lib/predictions/fundamental";

const recommendationColors = {
  'STRONG BUY': 'text-green-400',
  'BUY': 'text-green-300',
  'HOLD': 'text-yellow-300',
  'SELL': 'text-red-300',
  'STRONG SELL': 'text-red-400',
};

export default function FundamentalAnalysis({ selectedIssuer }: { selectedIssuer?: issuer }) {
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
        <h2 className="text-2xl font-bold mb-4">Fundamental Analysis</h2>
        <p className="text-zinc-400">Select an issuer to view fundamental analysis</p>
      </div>
    );
  }

  if (isLoading) {
    return (  
      <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
        <h2 className="text-2xl font-bold mb-4">Fundamental Analysis</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
      <h2 className="text-2xl font-bold mb-4">Fundamental Analysis</h2>
      {analysis ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">News Sentiment Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-zinc-400">Sentiment Score</p>
                <p className="text-xl font-mono">
                  {analysis.sentiment !== undefined ? (
                    `${analysis.sentiment >= 0 ? '+' : ''}${analysis.sentiment.toFixed(3)}`
                  ) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-zinc-400">Recent News Count</p>
                <p className="text-xl font-mono">{analysis.newsCount ?? 0}</p>
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-zinc-400">Recommendation</p>
            <p className={`text-2xl font-bold ${recommendationColors[analysis.recommendation as keyof typeof recommendationColors]}`}>
              {analysis.recommendation}
            </p>
          </div>

          {analysis.latestDate && (
            <div className="text-sm text-zinc-500">
              Last updated: {new Date(analysis.latestDate).toLocaleDateString()}
            </div>
          )}
        </div>
      ) : (
        <p className="text-zinc-400">No sentiment data available for this issuer</p>
      )}
    </div>
  );
}
