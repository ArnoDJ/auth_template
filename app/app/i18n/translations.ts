import de from "./locales/de.json"
import en from "./locales/en.json"
import fr from "./locales/fr.json"
import nl from "./locales/nl.json"

export const supportedLocales = ["en", "nl", "fr", "de"] as const

export type Locale = (typeof supportedLocales)[number]

export const localeLabels: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  fr: "Francais",
  de: "Deutsch"
}

export type TranslationKey = keyof typeof en

export type TranslationMap = Record<Locale, Record<TranslationKey, string>>

export const translations: TranslationMap = {
  en,
  nl,
  fr,
  de
}

export const defaultLocale: Locale = "en"
