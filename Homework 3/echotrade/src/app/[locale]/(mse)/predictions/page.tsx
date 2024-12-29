"use client";

import { issuer } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import TechnicalAnalysis from "@/components/analysis/technicalAnalysis";
import FundamentalAnalysis from "@/components/analysis/fundamentalAnalysis";
import LSTMPredictions from "@/components/analysis/lstmPredictions";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

export default function Predictions() {
  const t = useTranslations("Predictions");
  const router = useRouter();

  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [issuers, setIssuers] = useState<issuer[]>([]);
  const [selectedIssuer, setSelectedIssuer] = useState<issuer>();

  useEffect(() => {
    fetch("/api/issuers")
      .then(res => res.json())
      .then(data => {
        setIssuers(data.sort((a: issuer, b: issuer) => a.code.localeCompare(b.code)));
        setSelectedIssuer(code ? data.find((i: issuer) => i.code === code) : undefined);
      });
  }, [code]);

  const handleIssuerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedIssuer(issuers.find(i => i.code === e.target.value));
    router.replace(`/predictions?code=${e.target.value}`);
  };

  return (
    <div className="w-full min-h-screen bg-zinc-900 text-white px-6 md:px-20 py-12">
      <div className="max-w-12xl mx-auto">
        <div className="flex justify-between items-start md:items-center gap-4 mb-12 font-[family-name:var(--font-roboto)]">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              {t("title")}
            </h1>
            <p className="predictions-subheader">
              {t("description")}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <select
            className="select-md"
            value={selectedIssuer?.code || ""}
            onChange={handleIssuerChange}
          >
            <option value="">{t("selectIssuer")}</option>
            {issuers.map((issuer) => (
              <option key={issuer.id} value={issuer.code}>{issuer.code}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Suspense fallback={<div>Loading...</div>}>
            <TechnicalAnalysis selectedIssuer={selectedIssuer} />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <FundamentalAnalysis selectedIssuer={selectedIssuer} />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <LSTMPredictions selectedIssuer={selectedIssuer} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}