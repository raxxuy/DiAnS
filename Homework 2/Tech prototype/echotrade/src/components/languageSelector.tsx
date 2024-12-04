"use client";

import { useState } from "react";

const languages = [
  { code: "en", label: "English" },
  { code: "mk", label: "Македонски" }
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");

  const handleLanguageChange = (langCode: string) => {
    setSelectedLang(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl
          bg-zinc-800/50 backdrop-blur-sm border
          ${isOpen ? "border-indigo-500/50 shadow-lg shadow-indigo-500/10" : "border-zinc-700/30 hover:border-zinc-600/50"}
          transition-all duration-300
        `}
      >
        <span className={`text-sm font-medium bg-gradient-to-r bg-clip-text text-transparent ${isOpen ? "from-[#7779ff] via-[#bf65fb] to-[#f75bff]" : "from-zinc-400 via-zinc-400 to-zinc-400"} transition-colors duration-300`}>
          {languages.find(lang => lang.code === selectedLang)?.label}
        </span>
        
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={`transition-transform duration-300 ${isOpen ? "rotate-180 text-[#f75bff]" : "text-zinc-400"}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 min-w-[140px] py-1 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/30 rounded-xl shadow-lg transform origin-top animate-in fade-in duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-2 text-left text-sm transition-all duration-200 ${
                selectedLang === lang.code 
                  ? "bg-[#bf65fb]/10 bg-clip-text text-[#bf65fb]"
                  : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50"
              } flex items-center justify-between`}
            >
              {lang.label}
              {selectedLang === lang.code && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-[#bf65fb]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}