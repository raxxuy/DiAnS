"use server";

import db from "..";

export async function getNews() {
  const news = await db.news.findMany();
  return news;
}

export async function getNewsItem(id: number) {
  const news = await db.news.findUnique({ where: { id } });
  return news;
}

