// lib/i18n.ts
import { id } from "@/locales/id/common";
import { en } from "@/locales/en/common";

export const languages = {
  id,
  en,
};

export const getLang = (lang: "id" | "en" = "id") => {
  return languages[lang];
};