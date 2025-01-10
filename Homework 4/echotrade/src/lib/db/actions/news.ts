"use server";

import db from "..";

export async function getNews(locale: string) {
  const news = await db.news.findMany({ where: { locale } });
  return news;
}

export async function getNewsItem(id: number, locale: string) {
  const news = await db.news.findUnique({
    where: {
      shared_id_locale: {
        shared_id: id,
        locale
      }
    }
  });
  return news;
}
