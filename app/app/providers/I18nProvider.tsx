"use client"

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react"
import {
  defaultLocale,
  Locale,
  localeLabels,
  supportedLocales,
  translations
} from "../i18n/translations"

const localeStorageKey = "auth-template.locale"

type I18nContextValue = {
  locale: Locale
  locales: readonly Locale[]
  localeLabels: Record<Locale, string>
  setLocale: (locale: Locale) => void
  t: (key: keyof typeof translations.en) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const normalizeLocale = (candidate: string | null | undefined): Locale => {
  if (!candidate) {
    return defaultLocale
  }

  const short = candidate.toLowerCase().split("-")[0]
  if (supportedLocales.includes(short as Locale)) {
    return short as Locale
  }

  return defaultLocale
}

export const I18nProvider = ({
  children
}: Readonly<{ children: ReactNode }>) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return defaultLocale
    }

    const stored = window.localStorage.getItem(localeStorageKey)
    const browserLocale = window.navigator.language
    return normalizeLocale(stored ?? browserLocale)
  })

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(localeStorageKey, locale)
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<I18nContextValue>(() => {
    const setLocale = (nextLocale: Locale): void => {
      setLocaleState(nextLocale)
    }

    const t = (key: keyof typeof translations.en): string => {
      return translations[locale][key] ?? translations[defaultLocale][key]
    }

    return {
      locale,
      locales: supportedLocales,
      localeLabels,
      setLocale,
      t
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }

  return context
}
