import Link from "next/link";
import Image from "next/image";
import LanguageSelector from "./languageSelector";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

export default function NavBar() {
  const locale = useLocale();
  const t = useTranslations("NavBar");
  
  const navLinks = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/market-data`, label: t("marketData") },
    { href: `/${locale}/issuers`, label: t("issuers") },
    { href: `/${locale}/predictions`, label: t("predictions") },
    { href: `/${locale}/news`, label: t("news") },
    { href: `/${locale}/about`, label: t("about") }
  ];

  return (
    <nav className="flex w-full h-20 items-center justify-between bg-zinc-900 px-16 text-white font-[family-name:var(--font-raleway)]">
      <Link
        href="/" 
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <Image 
          src="/logo.png" 
          alt="Logo" 
          width={150} 
          height={60}
          className="w-auto h-auto"
        />
      </Link>

      <div className="flex items-center gap-10">
        {navLinks.map(({ href, label }) => (
          <Link 
            key={href} 
            href={href}
            className="font-medium bg-clip-text bg-gradient-to-r from-white via-white to-white hover:from-[#7779ff] hover:via-[#bf65fb] hover:to-[#f350fd] hover:text-transparent transition-all"
          >
            {label}
          </Link>
        ))}
        <LanguageSelector />
      </div>
    </nav>
  );
}