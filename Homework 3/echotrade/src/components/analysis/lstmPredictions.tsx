"use client";

import { useEffect, useState } from "react";
import { LSTMPrediction } from "@/lib/predictions/lstm";
import { issuer } from "@prisma/client";
import LSTMChart from "./lstmChart";

export default function LSTMPredictions({ selectedIssuer }: { selectedIssuer?: issuer }) {
  const [predictions, setPredictions] = useState<LSTMPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedIssuer) {
      setPredictions([]);
      return;
    }

    fetch(`/api/predictions/lstm?issuer_id=${selectedIssuer.id}`)
      .then(response => response.json())
      .then(data => setPredictions(data))
      .catch(error => console.error(error))
      .finally(() => setIsLoading(false));
  }, [selectedIssuer]);

  if (!selectedIssuer) {
    return (
      <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
        <h2 className="text-2xl font-bold mb-4">LSTM Price Predictions</h2>
        <p className="text-zinc-400">Select an issuer to view LSTM price predictions</p>
      </div>
    );
  }

  if (isLoading) {
    return (  
      <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
        <h2 className="text-2xl font-bold mb-4">LSTM Price Predictions</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
      <h2 className="text-2xl font-bold mb-4">LSTM Price Predictions</h2>
      {predictions.length > 0 ? (
        <div className="w-full h-[400px]">
          <LSTMChart predictions={predictions} />
        </div>
      ) : (
        <p className="text-zinc-400">
          Not enough historical data to generate predictions. The issuer must have at least 10 days of historical data.
        </p>
      )}
    </div>
  );
}
