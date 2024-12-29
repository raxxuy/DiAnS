"use client";

import { useState, useEffect } from "react";
import { news } from "@prisma/client";
import Link from "next/link";
import SearchBar from "@/components/searchBar";
import { useLocale, useTranslations } from "next-intl";

export default function News() {
  const t = useTranslations("News");
  const locale = useLocale();
  
  const [news, setNews] = useState<news[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 8;
  const filteredNews = news.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    fetch(`/api/news?locale=${locale}`)
      .then(res => res.json())
      .then(data => {
        setNews(data.sort((a: news, b: news) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setIsLoading(false);
      });
  }, [locale]);

  const currentNews = filteredNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-zinc-900 text-white px-6 md:px-20 py-12 font-[family-name:var(--font-roboto)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                {t("title")}
              </h1>
              <p className="text-zinc-400 mt-2">
                {t("description")}
              </p>
            </div>
            <SearchBar setSearch={setSearch} placeholder={t("placeholder")} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-zinc-800/50 rounded-xl p-6 animate-pulse">
                <div className="h-7 w-3/4 bg-zinc-700/50 rounded mb-3"></div>
                <div className="h-5 w-40 bg-zinc-700/50 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-900 text-white px-6 md:px-20 py-12 font-[family-name:var(--font-roboto)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h1 className="news-header">
              {t("title")}
            </h1>
            <p className="news-subheader">
              {t("description")}
            </p>
          </div>
          <SearchBar setSearch={setSearch} placeholder={t("placeholder")} />
        </div>
        
        <div className="flex flex-col gap-4">
          {currentNews.map(n => (
            <Link 
              href={`/${locale}/news/${n.shared_id}`} 
              key={n.id} 
              className="group news-card"
            >
              <div className="flex flex-col gap-2">
                <h2 className="news-title">
                  {n.title}
                </h2>
                <div className="news-date">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(n.date).toLocaleDateString(locale === "en" ? "en-US" : "mk-MK", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex justify-center gap-3 mt-12">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="news-pagination-button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("pagination.previous")}
          </button>
          <span className="news-pagination-current">
            {t("pagination.current", { currentPage, totalPages })}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="news-pagination-button"
          >
            {t("pagination.next")}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
