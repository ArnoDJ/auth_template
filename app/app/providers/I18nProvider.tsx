"use client"

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore
} from "react"
import {
  defaultLocale,
  Locale,
  localeLabels,
  supportedLocales,
  translations
} from "../i18n/translations"

const localeStorageKey = "auth-template.locale"
const localeChangeEvent = "auth-template-locale-change"

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
  const readStoredLocale = (): Locale => {
    if (typeof window === "undefined") {
      return defaultLocale
    }

    const stored = window.localStorage.getItem(localeStorageKey)
    const browserLocale = window.navigator.language
    return normalizeLocale(stored ?? browserLocale)
  }

  const subscribeToLocale = (onStoreChange: () => void): (() => void) => {
    if (typeof window === "undefined") {
      return () => undefined
    }

    const handleStorage = (event: StorageEvent): void => {
      if (event.key === null || event.key === localeStorageKey) {
        onStoreChange()
      }
    }

    const handleLocaleChange = (): void => {
      onStoreChange()
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(localeChangeEvent, handleLocaleChange)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(localeChangeEvent, handleLocaleChange)
    }
  }

  const locale = useSyncExternalStore(
    subscribeToLocale,
    readStoredLocale,
    () => defaultLocale
  )

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<I18nContextValue>(() => {
    const setLocale = (nextLocale: Locale): void => {
      window.localStorage.setItem(localeStorageKey, nextLocale)
      window.dispatchEvent(new Event(localeChangeEvent))
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
