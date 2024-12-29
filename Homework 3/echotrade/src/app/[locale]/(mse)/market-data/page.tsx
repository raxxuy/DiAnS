"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { issuer, stockhistory } from "@prisma/client";
import ExportButtons from "@/components/exportButtons";
import StockChart from "@/components/stockChart";

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

  const renderTable = () => (
    <div className="market-data-table">
      <table className="w-full border-collapse">
        <thead>
          <tr className="market-data-table-header">
            <th>Date</th>
            <th>Last Trade Price</th>
            <th>Max Price</th>
            <th>Min Price</th>
            <th>Avg Price</th>
            <th>Change</th>
            <th>Volume</th>
            <th>Turnover Best</th>
            <th>Total Turnover</th>
          </tr>
        </thead>
        <tbody>
          {stockHistory.length === 0 ? (
            <tr>
              <td colSpan={9} className="market-data-td text-center text-zinc-400">
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
                <td>{h.avg_price}</td>
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
    <StockChart stockHistory={stockHistory} />
  );

  return (
    <div className="w-full min-h-screen bg-zinc-900 text-white px-6 md:px-20 py-12 ">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center md:items-center gap-4 mb-12">
          <div className="w-1/2 font-[family-name:var(--font-roboto)]">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              Market Data
            </h1>
            <p className="text-zinc-400 mt-2">
              Track historical stock prices and market performance
            </p>
          </div>

          <div className="market-data-controls md:flex-row gap-4 flex justify-end">
            <div className="flex flex-wrap gap-2">
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
            <ExportButtons
              stockHistory={stockHistory}
              code={selectedIssuer?.code}
              fromDate={fromDate}
              toDate={toDate}
            />
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