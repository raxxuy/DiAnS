import { analyzeTechnicalIndicators } from "@/lib/predictions/technical";
import { getStockHistoryByIssuerId } from "@/lib/db/actions/stocks";
import { NextRequest, NextResponse } from "next/server";
import { AnalysisResult } from "@/lib/predictions/technical";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const issuer_id = searchParams.get("issuer_id");

  if (!issuer_id) {
    return NextResponse.json({ error: "Missing issuer_id" }, { status: 400 });
  }

  const stockHistory = (await getStockHistoryByIssuerId(parseInt(issuer_id))).filter(item => item.date > new Date(new Date().setFullYear(new Date().getFullYear() - 1)));  

  if (!stockHistory || stockHistory.length < 14) {
    return NextResponse.json({
      error: "Insufficient data",
      message: "Not enough historical data available for technical analysis"
    }, { status: 404 });
  }

  const analysis = analyzeTechnicalIndicators(stockHistory);

  const getIndicatorData = (period: string, type: "oscillators" | "movingAverages", indicator: string) => {
    const result = analysis.find(a => a.period === period);

    const data = type === "oscillators"
      ? result?.oscillators[indicator as keyof AnalysisResult["oscillators"]].at(-1)
      : result?.movingAverages[indicator as keyof AnalysisResult["movingAverages"]].at(-1);

    const value = Array.isArray(data?.value) ? data.value[0] : data?.value;

    return {
      value: value || 0,
      signal: data?.signal || "hold"
    };
  };

  const createIndicator = (name: string, type: string, indicatorType: "oscillators" | "movingAverages", indicator: string) => ({
    name,
    type,
    values: {
      daily: getIndicatorData("day", indicatorType, indicator).value,
      weekly: getIndicatorData("week", indicatorType, indicator).value,
      monthly: getIndicatorData("month", indicatorType, indicator).value,
    },
    signal: getIndicatorData("day", indicatorType, indicator).signal
  });

  const oscillators = [
    createIndicator("RSI", "oscillator", "oscillators", "rsi"),
    createIndicator("MACD", "oscillator", "oscillators", "macd"),
    createIndicator("Stochastic", "oscillator", "oscillators", "stochastic"),
    createIndicator("CCI", "oscillator", "oscillators", "cci"),
    createIndicator("Williams %R", "oscillator", "oscillators", "williamsR")
  ];

  const movingAverages = [
    createIndicator("SMA", "ma", "movingAverages", "sma"),
    createIndicator("EMA", "ma", "movingAverages", "ema"),
    createIndicator("WMA", "ma", "movingAverages", "wma"),
    createIndicator("WEMA", "ma", "movingAverages", "wema"),
    createIndicator("TRIX", "ma", "movingAverages", "trix")
  ];

  return NextResponse.json([...oscillators, ...movingAverages]);
}
