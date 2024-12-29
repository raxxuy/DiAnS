"use client";

import SearchBar from "@/components/searchBar";
import { useEffect, useState } from "react";
import { company, issuer } from "@prisma/client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function Issuers() {
  const t = useTranslations("Issuers");
  const locale = useLocale();

  const [companies, setCompanies] = useState<company[]>([]);
  const [issuers, setIssuers] = useState<issuer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const filteredIssuers = issuers.filter(issuer => 
    issuer.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    fetch(`/api/issuers`)
      .then(res => res.json())
      .then(data => {
        setIssuers(data.sort((a: issuer, b: issuer) => a.code.localeCompare(b.code)));
        fetch(`/api/companies?locale=${locale}`)
          .then(res => res.json())
          .then(companyData => {
            setCompanies(companyData);
            setIsLoading(false);
          });
      });
  }, [locale]);

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
            <SearchBar setSearch={setSearch} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-zinc-800/50 rounded-xl h-32"></div>
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
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              {t("title")}
            </h1>
            <p className="text-zinc-400 mt-2">
              {t("description")}
            </p>
          </div>
          <SearchBar setSearch={setSearch}/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssuers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-zinc-400">
              {t("noIssuersFound")}
            </div>
          ) : (
            filteredIssuers.map(issuer => (
              <Link
                key={issuer.id}
                href={`/${locale}/issuers/${issuer.code}`}
                prefetch={true}
                className="group issuer-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="issuer-code">
                      {issuer.code}
                    </div>
                    <div className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 mt-2">
                      {companies.find(company => company.id === issuer.company_id)?.name}
                    </div>
                  </div>
                  <div className="text-zinc-600 group-hover:text-[#bf65fb] transition-colors duration-300">
                    <svg
                      className="w-6 h-6 transform transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <span className="issuer-tag">{t("card.details")}</span>
                  <span className="issuer-tag">{t("card.analysis")}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}