import { getRecentNewsSentiments } from "@/lib/db/actions/news_sentiments";

export type SentimentAnalysis = {
  sentiment: number;
  recommendation: string;
  newsCount: number;
  latestDate: Date | null;
};

export async function getIssuerSentiment(issuerId: number): Promise<SentimentAnalysis | null> {
  const sentiments = await getRecentNewsSentiments(issuerId);

  if (sentiments.length === 0) {
    return null;
  }

  const avgSentiment = sentiments.reduce((acc, curr) => acc + curr.sentiment, 0) / sentiments.length;

  let recommendation = 'HOLD';
  if (avgSentiment > 0.3) recommendation = 'STRONG BUY';
  else if (avgSentiment > 0.1) recommendation = 'BUY';
  else if (avgSentiment < -0.3) recommendation = 'STRONG SELL';
  else if (avgSentiment < -0.1) recommendation = 'SELL';

  return {
    sentiment: Number(avgSentiment.toFixed(3)),
    recommendation,
    newsCount: sentiments.length,
    latestDate: sentiments[0]?.created_at || null
  };
}
