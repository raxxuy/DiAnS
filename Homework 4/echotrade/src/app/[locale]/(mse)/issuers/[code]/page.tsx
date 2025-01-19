"use client";

import Link from "next/link";
import { issuer as Issuer, company as Company } from "@prisma/client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const apiUrl = process.env.API_URL || "http://localhost:5000";

export default function IssuerPage() {
  const t = useTranslations("Issuer");
  const locale = useLocale();
  
  const { code } = useParams();
  const [issuer, setIssuer] = useState<Issuer>();
  const [company, setCompany] = useState<Company>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/api/issuers/${code}`)
      .then(res => res.json())
      .then(data => {
        setIssuer(data);
        if (data) {
          fetch(`${apiUrl}/api/companies/${data.company_id}?locale=${locale}`)
            .then(res => res.json())
            .then(companyData => {
              setCompany(companyData);
              setIsLoading(false);
            });
        } else {
          setIsLoading(false);
        }
      });
  }, [code, locale]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-zinc-900 text-white px-6 md:px-20 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-pulse">
            <div>
              <div className="h-10 w-64 bg-zinc-800/50 rounded-lg"></div>
              <div className="h-6 w-96 bg-zinc-800/50 rounded-lg mt-2"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-32 bg-zinc-800/50 rounded-lg"></div>
              <div className="h-10 w-32 bg-zinc-800/50 rounded-lg"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-700/30">
              <div className="h-7 w-48 bg-zinc-700/50 rounded mb-8"></div>
              <div className="space-y-6">
                <div>
                  <div className="h-4 w-24 bg-zinc-700/50 rounded mb-2"></div>
                  <div className="h-6 w-full bg-zinc-700/50 rounded"></div>
                </div>
                <div>
                  <div className="h-4 w-24 bg-zinc-700/50 rounded mb-2"></div>
                  <div className="h-6 w-3/4 bg-zinc-700/50 rounded"></div>
                </div>
                <div>
                  <div className="h-4 w-24 bg-zinc-700/50 rounded mb-2"></div>
                  <div className="h-6 w-1/2 bg-zinc-700/50 rounded"></div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-700/30">
              <div className="h-7 w-48 bg-zinc-700/50 rounded mb-8"></div>
              <div className="space-y-6">
                <div>
                  <div className="h-4 w-24 bg-zinc-700/50 rounded mb-2"></div>
                  <div className="h-6 w-full bg-zinc-700/50 rounded"></div>
                </div>
                <div>
                  <div className="h-4 w-24 bg-zinc-700/50 rounded mb-2"></div>
                  <div className="h-6 w-3/4 bg-zinc-700/50 rounded"></div>
                </div>
                <div>
                  <div className="h-4 w-24 bg-zinc-700/50 rounded mb-2"></div>
                  <div className="h-6 w-1/2 bg-zinc-700/50 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!issuer || !company) {
    return (
      <div className="w-full min-h-screen bg-zinc-900 text-white px-6 md:px-20 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-8 border border-zinc-700/30 text-center">
            <h1 className="text-2xl font-bold text-red-400">{t("notFound.title")}</h1>
            <p className="mt-4 text-zinc-400">{t("notFound.description")}</p>
            <Link
              href={`/${locale}/issuers`}
              className="inline-block mt-6 px-4 py-2 rounded-lg bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 transition-colors duration-300"
            >
              {t("notFound.button")}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-zinc-900 text-white px-6 md:px-20 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="issuer-detail-header">
                {issuer.code}
              </h1>
              <p className="text-zinc-400 mt-2">
                {t("description")}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/${locale}/market-data?code=${issuer.code}`}
                className="issuer-detail-button"
              >
                {t("links.marketData")}
              </Link>
              <Link
                href={`/${locale}/predictions?code=${issuer.code}`}
                className="issuer-detail-button"
              >
                {t("links.predictions")}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="issuer-detail-card">
              <h2 className="issuer-detail-title">
                {t("company.information.title")}
              </h2>
              <div className="issuer-detail-field">
                <div>
                  <span className="issuer-detail-label">{t("company.information.name")}</span>
                  <p className="issuer-detail-value">{company.name}</p>
                </div>
                {company.address && (
                  <div>
                    <span className="issuer-detail-label">{t("company.information.address")}</span>
                    <p className="issuer-detail-value">{company.address}</p>
                  </div>
                )}
                {company.website && (
                  <div>
                    <span className="issuer-detail-label">{t("company.information.website")}</span>
                    <p>
                      <Link
                        href={company.website}
                        target="_blank"
                        className="issuer-detail-value text-indigo-400 hover:text-[#bf65fb] transition-colors duration-300"
                      >
                        {company.website}
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="issuer-detail-card">
              <h2 className="issuer-detail-title">
                {t("company.contact.title")}
              </h2>
              <div className="issuer-detail-field">
                {company.contact_person && (
                  <div>
                    <span className="issuer-detail-label">{t("company.contact.person")}</span>
                    <p className="issuer-detail-value">{company.contact_person}</p>
                  </div>
                )}
                {company.email && (
                  <div>
                    <span className="issuer-detail-label">{t("company.contact.email")}</span>
                    <p className="issuer-detail-value">{company.email}</p>
                  </div>
                )}
                {company.phones.length > 0 && (
                  <div>
                    <span className="issuer-detail-label">{t("company.contact.phone")}</span>
                    <p className="issuer-detail-value">{company.phones.join(", ")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}