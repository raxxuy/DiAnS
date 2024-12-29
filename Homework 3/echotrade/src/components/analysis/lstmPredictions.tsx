"use client";

import { useEffect, useState } from "react";
import { LSTM, LSTMPrediction } from "@/lib/predictions/lstm";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { issuer } from "@prisma/client";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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

  const chartData = {
    labels: predictions.map(p => new Date(p.prediction_date).toLocaleDateString()),
    datasets: [
      {
        label: 'Predicted Price',
        data: predictions.map(p => p.predicted_price),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `${context.parsed.y.toLocaleString()}`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function (value) {
            return `${value.toLocaleString()}`;
          }
        }
      }
    }
  };

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
          <div className="h-full">
            <Line data={chartData} options={options} />
          </div>
        </div>
      ) : (
        <p className="text-zinc-400">Not enough historical data to generate predictions. The issuer must have at least 10 days of historical data.</p>
      )}
    </div>
  );
}
