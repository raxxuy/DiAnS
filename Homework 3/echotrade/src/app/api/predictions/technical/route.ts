import { analyzeTechnicalIndicators } from '@/lib/predictions/technical';
import { getStockHistoryByIssuerId } from "@/lib/db/actions/stocks";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const issuer_id = searchParams.get("issuer_id");

  if (!issuer_id) {
    return NextResponse.json({ error: "Missing issuer_id" }, { status: 400 });
  }

  const stockHistory = await getStockHistoryByIssuerId(parseInt(issuer_id));
  
  if (!stockHistory || stockHistory.length < 14) {
    return NextResponse.json({ 
      error: "Insufficient data",
      message: "Not enough historical data available for technical analysis"
    }, { status: 404 });
  }

  const analysis = analyzeTechnicalIndicators(stockHistory);

  const oscillators = [
    {
      name: "RSI",
      type: "oscillator",
      values: {
        daily: analysis.find(a => a.period === 'day')?.oscillators?.rsi?.at?.(-1)?.value as number || 0,
        weekly: analysis.find(a => a.period === 'week')?.oscillators?.rsi?.at?.(-1)?.value as number || 0,
        monthly: analysis.find(a => a.period === 'month')?.oscillators?.rsi?.at?.(-1)?.value as number || 0,
      },
      signal: analysis.find(a => a.period === 'day')?.oscillators?.rsi?.at?.(-1)?.signal || "hold"
    },
    {
      name: "MACD",
      type: "oscillator",
      values: {
        daily: (analysis.find(a => a.period === 'day')?.oscillators?.macd?.at?.(-1)?.value as number[])?.[0] || 0,
        weekly: (analysis.find(a => a.period === 'week')?.oscillators?.macd?.at?.(-1)?.value as number[])?.[0] || 0,
        monthly: (analysis.find(a => a.period === 'month')?.oscillators?.macd?.at?.(-1)?.value as number[])?.[0] || 0,
      },
      signal: analysis.find(a => a.period === 'day')?.oscillators?.macd?.at?.(-1)?.signal || "hold"
    },
    {
      name: "Stochastic",
      type: "oscillator",
      values: {
        daily: (analysis.find(a => a.period === 'day')?.oscillators?.stochastic?.at?.(-1)?.value as number[])?.[0] || 0,
        weekly: (analysis.find(a => a.period === 'week')?.oscillators?.stochastic?.at?.(-1)?.value as number[])?.[0] || 0,
        monthly: (analysis.find(a => a.period === 'month')?.oscillators?.stochastic?.at?.(-1)?.value as number[])?.[0] || 0,
      },
      signal: analysis.find(a => a.period === 'day')?.oscillators?.stochastic?.at?.(-1)?.signal || "hold"
    },
    {
      name: "CCI",
      type: "oscillator",
      values: {
        daily: analysis.find(a => a.period === 'day')?.oscillators?.cci?.at?.(-1)?.value as number || 0,
        weekly: analysis.find(a => a.period === 'week')?.oscillators?.cci?.at?.(-1)?.value as number || 0,
        monthly: analysis.find(a => a.period === 'month')?.oscillators?.cci?.at?.(-1)?.value as number || 0,
      },
      signal: analysis.find(a => a.period === 'day')?.oscillators?.cci?.at?.(-1)?.signal || "hold"
    },
    {
      name: "Williams %R",
      type: "oscillator",
      values: {
        daily: analysis.find(a => a.period === 'day')?.oscillators?.williamsR?.at?.(-1)?.value as number || 0,
        weekly: analysis.find(a => a.period === 'week')?.oscillators?.williamsR?.at?.(-1)?.value as number || 0,
        monthly: analysis.find(a => a.period === 'month')?.oscillators?.williamsR?.at?.(-1)?.value as number || 0,
      },
      signal: analysis.find(a => a.period === 'day')?.oscillators?.williamsR?.at?.(-1)?.signal || "hold"
    }
  ];

  const movingAverages = [
    {
      name: "SMA",
      type: "ma",
      values: {
        daily: analysis.find(a => a.period === 'day')?.movingAverages?.sma?.at?.(-1)?.value as number || 0,
        weekly: analysis.find(a => a.period === 'week')?.movingAverages?.sma?.at?.(-1)?.value as number || 0,
        monthly: analysis.find(a => a.period === 'month')?.movingAverages?.sma?.at?.(-1)?.value as number || 0,
      },
      signal: analysis.find(a => a.period === 'day')?.movingAverages?.sma?.at?.(-1)?.signal || "hold"
    },
    {
      name: "EMA",
      type: "ma",
      values: {
        daily: analysis.find(a => a.period === 'day')?.movingAverages?.ema?.at?.(-1)?.value as number || 0,
        weekly: analysis.find(a => a.period === 'week')?.movingAverages?.ema?.at?.(-1)?.value as number || 0,
        monthly: analysis.find(a => a.period === 'month')?.movingAverages?.ema?.at?.(-1)?.value as number || 0,
      },
      signal: analysis.find(a => a.period === 'day')?.movingAverages?.ema?.at?.(-1)?.signal || "hold"
    },
    {
      name: "WMA",
      type: "ma",
      values: {
        daily: analysis.find(a => a.period === 'day')?.movingAverages?.wma?.at?.(-1)?.value as number || 0,
        weekly: analysis.find(a => a.period === 'week')?.movingAverages?.wma?.at?.(-1)?.value as number || 0,
        monthly: analysis.find(a => a.period === 'month')?.movingAverages?.wma?.at?.(-1)?.value as number || 0,
      },
      signal: analysis.find(a => a.period === 'day')?.movingAverages?.wma?.at?.(-1)?.signal || "hold"
    },
    {
      name: "WEMA",
      type: "ma",
      values: {
        daily: analysis.find(a => a.period === 'day')?.movingAverages?.wema?.at?.(-1)?.value as number || 0,
        weekly: analysis.find(a => a.period === 'week')?.movingAverages?.wema?.at?.(-1)?.value as number || 0,
        monthly: analysis.find(a => a.period === 'month')?.movingAverages?.wema?.at?.(-1)?.value as number || 0,
      },
      signal: analysis.find(a => a.period === 'day')?.movingAverages?.wema?.at?.(-1)?.signal || "hold"
    },
    {
      name: "TRIX",
      type: "ma",
      values: {
        daily: analysis.find(a => a.period === 'day')?.movingAverages?.trix?.at?.(-1)?.value as number || 0,
        weekly: analysis.find(a => a.period === 'week')?.movingAverages?.trix?.at?.(-1)?.value as number || 0,
        monthly: analysis.find(a => a.period === 'month')?.movingAverages?.trix?.at?.(-1)?.value as number || 0,
      },
      signal: analysis.find(a => a.period === 'day')?.movingAverages?.trix?.at?.(-1)?.signal || "hold"
    }
  ];

  return NextResponse.json([...oscillators, ...movingAverages]);
}