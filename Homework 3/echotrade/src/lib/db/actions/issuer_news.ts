"use server";

import db from "..";

export async function getIssuerNews(issuerId: number) {
  const news = await db.issuer_news.findMany({ where: { issuer_id: issuerId } });
  return news;
}

export async function getIssuerNewsItem(id: number) {
  const news = await db.issuer_news.findUnique({ where: { id } });
  return news;
}
