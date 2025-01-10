import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function SearchBar({
  setSearch,
  placeholder = ""
}: {
  setSearch: (search: string) => void;
  placeholder?: string;
}) {
  const t = useTranslations("SearchBar");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="relative text-base">
      <div
        className={`
          relative flex items-center w-72 px-4 py-3 rounded-xl
          bg-zinc-800/50 backdrop-blur-sm border
          ${isFocused
            ? 'border-zinc-300/50 shadow-lg shadow-zinc-400/10'
            : 'border-zinc-300/30'
          }
          transition-all duration-300 group
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`
            h-5 w-5 mr-3
            ${isFocused ? 'text-zinc-300' : 'text-zinc-400'}
            transition-colors duration-300
          `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder={placeholder || t("placeholder")}
          className="
            w-full bg-transparent text-white placeholder-zinc-400
            focus:outline-none
          "
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <div className={`
          absolute inset-0 -z-10 rounded-xl opacity-0
          transition-opacity duration-300
          ${isFocused ? 'opacity-100' : ''}
        `} />
      </div>
      {!isFocused && (
        <div className="mt-2 ml-4">
          <span className="text-xs text-zinc-500">
            {t("tip1")} <kbd className="px-2 py-0.5 text-xs rounded-md bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">/</kbd> {t("tip2")}
          </span>
        </div>
      )}
    </div>
  );
}