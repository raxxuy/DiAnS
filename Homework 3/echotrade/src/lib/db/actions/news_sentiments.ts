"use server";

import db from "..";

export async function getNewsSentiments(issuerId: number) {
  const sentiments = await db.news_sentiment.findMany({
    where: {
      issuer_news: {
        issuer_id: issuerId
      }
    }
  });

  return sentiments;
}

export async function getNewsSentiment(id: number) {
  const sentiment = await db.news_sentiment.findUnique({ where: { id } });
  return sentiment;
}

export async function getRecentNewsSentiments(issuerId: number) {
  const sentiments = await db.news_sentiment.findMany({
    where: {
      issuer_news: {
        issuer_id: issuerId,
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    },
    orderBy: { created_at: "desc" },
  });
  
  return sentiments;
}
