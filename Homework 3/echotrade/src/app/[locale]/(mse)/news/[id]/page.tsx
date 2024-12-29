"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect } from "react";
import { useState } from "react";
import { news } from "@prisma/client";

export default function NewsItem() {
  const locale = useLocale();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [news, setNews] = useState<news>();

  useEffect(() => {
    fetch(`/api/news/${id}?locale=${locale}`)
      .then(res => res.json())
      .then(data => {
        setNews(data);
        setIsLoading(false);
      });
  }, [id, locale]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-zinc-900 text-white px-4 md:px-8 lg:px-20 py-12">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 animate-pulse">
            <div className="h-10 w-3/4 bg-zinc-800/50 rounded mb-4"></div>
            <div className="h-4 w-32 bg-zinc-800/50 rounded"></div>
          </header>

          <article className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-zinc-700/30 shadow-xl animate-pulse">
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-zinc-700/50 rounded w-full"></div>
              ))}
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-900 text-white px-4 md:px-8 lg:px-20 py-12">
      {news ? (
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              {news.title}
            </h1>
            <div className="flex items-center text-zinc-400 text-sm">
              <time>{new Date(news.date).toLocaleDateString('en-GB')}</time>
            </div>
          </header>

          <article className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-zinc-700/30 shadow-xl">
            <div className="prose prose-invert max-w-none">
              {news.content.map((line: string, i: number) => (
                <p key={i} className="text-zinc-100 leading-relaxed mb-6 last:mb-0 whitespace-pre-wrap">
                  {line}
                </p>
              ))}
            </div>
          </article>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-semibold text-zinc-400">News item not found</h2>
          <p className="mt-2 text-zinc-500">The requested article could not be loaded</p>
        </div>
      )}
    </div>
  );
}
