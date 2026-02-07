// contexts/TranslationContext.jsx
import { createContext, useContext, useState } from "react";
import translations from "../data/translations.json";

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  const [lang, setLang] = useState("pt");

  const t = translations[lang] || translations["pt"];

  return (
    <TranslationContext.Provider value={{ t, lang, setLang }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
