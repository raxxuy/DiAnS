"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { issuer, stockhistory } from "@prisma/client";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function MarketDataContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  
  const [stockHistory, setStockHistory] = useState<stockhistory[]>([]);
  const [issuers, setIssuers] = useState<issuer[]>([]);
  const [selectedIssuer, setSelectedIssuer] = useState<issuer>();
  const [fromDate, setFromDate] = useState<string>(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");

  useEffect(() => {
    fetch("/api/issuers")
      .then(res => res.json())
      .then(data => {
        setIssuers(data.sort((a: issuer, b: issuer) => a.code.localeCompare(b.code)));
        setSelectedIssuer(code ? data.find((i: issuer) => i.code === code) : undefined);
      });
  }, [code]);

  useEffect(() => {
    if (!selectedIssuer) return;
    if (fromDate && toDate) {
      fetch(`/api/stocks/${selectedIssuer.id}`)
        .then(res => res.json())
      .then(data => {
        const filteredHistory = data
          .filter((h: stockhistory) => new Date(h.date).getTime() >= new Date(fromDate).getTime() && new Date(h.date).getTime() <= new Date(toDate).getTime())
          .sort((a: stockhistory, b: stockhistory) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setStockHistory(filteredHistory);
        });
    }
  }, [selectedIssuer, fromDate, toDate]);

  const chartData = {
    labels: stockHistory.map(h => new Date(h.date).toLocaleDateString()),
    datasets: [{
      label: "Last Trade Price",
      data: stockHistory.map(h => parseFloat(h.last_trade_price.replace(/[.]/g, ""))),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.3,
      fill: false
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 0,
          minRotation: 0
        }
      }
    }
  };

  const renderTable = () => (
    <div className="market-data-table">
      <table className="w-full border-collapse">
        <thead>
          <tr className="market-data-table-header">
            <th>Date</th>
            <th>Last Trade Price</th>
            <th>Max Price</th>
            <th>Min Price</th>
            <th>Change</th>
            <th>Volume</th>
            <th>Turnover Best</th>
            <th>Total Turnover</th>
          </tr>
        </thead>
        <tbody>
          {stockHistory.length === 0 ? (
            <tr>
              <td colSpan={8} className="market-data-td text-center text-zinc-400">
                No data available for this period
              </td>
            </tr>
          ) : (
            stockHistory.map(h => (
              <tr key={h.id} className="market-data-row">
                <td>{new Date(h.date).toLocaleDateString()}</td>
                <td>{h.last_trade_price}</td>
                <td>{h.max_price}</td>
                <td>{h.min_price}</td>
                <td className={`${parseFloat(h.percent_change.replace(",", ".")) > 0 ? 'text-emerald-400' : parseFloat(h.percent_change.replace(",", ".")) < 0 ? 'text-red-400' : ''}`}>
                  {`${h.percent_change}%`}
                </td>
                <td>{h.volume}</td>
                <td>{h.turnover_best}</td>
                <td>{h.total_turnover}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderChart = () => (
    <div className="market-data-chart">
      <Line data={chartData} options={chartOptions} />
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-zinc-900 text-white px-6 md:px-20 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h1 className="market-data-header">Market Data</h1>
            <p className="market-data-subheader">Track historical stock prices and market performance</p>
          </div>
          
          <div className="market-data-controls">
            <select 
              className="select-md"
              value={selectedIssuer?.code || ""}
              onChange={e => setSelectedIssuer(issuers.find(i => i.code === e.target.value))}
            >
              <option value="">Select an issuer</option>
              {issuers.map(issuer => (
                <option key={issuer.id} value={issuer.code}>{issuer.code}</option>
              ))}
            </select>

            <input
              type="date"
              className="select-md"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />

            <input
              type="date" 
              className="select-md"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />

            <select
              className="select-md"
              onChange={e => setViewMode(e.target.value as "table" | "chart")}
              value={viewMode}
            >
              <option value="table">Table View</option>
              <option value="chart">Chart View</option>
            </select>
          </div>
        </div>

        {selectedIssuer && (
          <div className="space-y-6">
            <h2 className="market-data-issuer-title">
              {selectedIssuer.code}
            </h2>
            {viewMode === "table" ? renderTable() : renderChart()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketData() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MarketDataContent />
    </Suspense>
  );
}