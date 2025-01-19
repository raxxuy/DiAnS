"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { issuer as Issuer, stockhistory as StockHistory } from "@prisma/client";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import ExportButtons from "@/components/exportButtons";
import StockChart from "@/components/stockChart";

const apiUrl = process.env.API_URL || "http://localhost:5000";  

export default function MarketData() {
  const t = useTranslations("MarketData");
  const locale = useLocale();
  const router = useRouter();

  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [selectedIssuer, setSelectedIssuer] = useState<Issuer>();
  const [fromDate, setFromDate] = useState<string>(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/api/issuers`)
      .then(res => res.json())
      .then(data => {
        setIssuers(data.sort((a: Issuer, b: Issuer) => a.code.localeCompare(b.code)));
        setSelectedIssuer(code ? data.find((i: Issuer) => i.code === code) : undefined);
      });
  }, [code]);

  useEffect(() => {
    if (!selectedIssuer) {
      setStockHistory([]);
      return;
    }

    if (fromDate && toDate) {
      setIsLoading(true);
      fetch(`${apiUrl}/api/stocks/${selectedIssuer.id}`)
        .then(res => res.json())
        .then(data => {
          const filteredHistory = data
            .filter((h: StockHistory) => new Date(h.date).getTime() >= new Date(fromDate).getTime() && new Date(h.date).getTime() <= new Date(toDate).getTime())
            .sort((a: StockHistory, b: StockHistory) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setStockHistory(filteredHistory);
        })
        .finally(() => setIsLoading(false));
    }
  }, [selectedIssuer, fromDate, toDate]);

  const handleIssuerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.replace(`/market-data?code=${e.target.value}`);
  };

  function switchDotsAndCommas(s: string) {
    function switcher(match: string) {
      return (match == ',') ? '.' : ',';
    }

    return s.replaceAll(/\.|\,/g, switcher);
  }

  const renderTable = () => (
    <div className="market-data-table">
      <table className="w-full border-collapse">
        <thead>
          <tr className="market-data-table-header">
            <th>{t("table.date")}</th>
            <th>{t("table.lastTradePrice")}</th>
            <th>{t("table.maxPrice")}</th>
            <th>{t("table.minPrice")}</th>
            <th>{t("table.avgPrice")}</th>
            <th>{t("table.change")}</th>
            <th>{t("table.volume")}</th>
            <th>{t("table.turnoverBest")}</th>
            <th>{t("table.totalTurnover")}</th>
          </tr>
        </thead>
        <tbody>
          {stockHistory.length === 0 ? (
            <tr>
              <td colSpan={9} className="market-data-td text-center text-zinc-400">
                {t("noData")}
              </td>
            </tr>
          ) : (
            stockHistory.map(h => (
              <tr key={h.id} className="market-data-row">
                {locale === "mk" ?
                  <>
                    <td>{new Date(h.date).toLocaleDateString("mk-MK").replace(" г.", "")}</td>
                    <td>{h.last_trade_price}</td>
                    <td>{h.max_price}</td>
                    <td>{h.min_price}</td>
                    <td className={`${parseFloat(h.percent_change.replace(",", ".")) > 0 ? 'text-emerald-400' : parseFloat(h.percent_change.replace(",", ".")) < 0 ? 'text-red-400' : ''}`}>
                      {`${h.percent_change}%`}
                    </td>
                    <td>{h.avg_price}</td>
                    <td>{h.volume}</td>
                    <td>{h.turnover_best}</td>
                    <td>{h.total_turnover}</td>
                  </>
                  :
                  <>
                    <td>{new Date(h.date).toLocaleDateString()}</td>
                    <td>{switchDotsAndCommas(h.last_trade_price)}</td>
                    <td>{switchDotsAndCommas(h.max_price)}</td>
                    <td>{switchDotsAndCommas(h.min_price)}</td>
                    <td>{switchDotsAndCommas(h.avg_price)}</td>
                    <td className={`${parseFloat(h.percent_change.replace(",", ".")) > 0 ? 'text-emerald-400' : parseFloat(h.percent_change.replace(",", ".")) < 0 ? 'text-red-400' : ''}`}>
                      {`${switchDotsAndCommas(h.percent_change)}%`}
                    </td>
                    <td>{h.volume}</td>
                    <td>{h.turnover_best}</td>
                    <td>{h.total_turnover}</td>
                  </>
                }
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
          <div className="w-2/3 font-[family-name:var(--font-roboto)]">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              {t("title")}
            </h1>
            <p className="text-zinc-400 mt-2">
              {t("description")}
            </p>
          </div>

          <div className="market-data-controls md:flex-row gap-4 flex justify-end">
            <div className="flex flex-wrap gap-2">
              <select
                className="select-md"
                value={selectedIssuer?.code || ""}
                onChange={handleIssuerChange}
              >
                <option value="">{t("selectIssuer")}</option>
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
                <option value="table">{t("view.table")}</option>
                <option value="chart">{t("view.chart")}</option>
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
          isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
              <div className="w-12 h-12 border-4 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
              <div className="text-zinc-400 animate-pulse">
                {t("loading")}
              </div>
            </div>
          ) :
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