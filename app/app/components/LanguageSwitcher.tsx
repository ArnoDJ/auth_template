"use client"

import { ChangeEvent } from "react"
import styles from "./LanguageSwitcher.module.css"
import { useI18n } from "../providers/I18nProvider"

export const LanguageSwitcher = () => {
  const { locale, locales, localeLabels, setLocale, t } = useI18n()

  const handleChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setLocale(event.target.value as (typeof locales)[number])
  }

  return (
    <label className={styles.switcher}>
      <span className={styles.label}>{t("common.language")}</span>
      <select className={styles.select} value={locale} onChange={handleChange}>
        {locales.map((availableLocale) => {
          return (
            <option key={availableLocale} value={availableLocale}>
              {localeLabels[availableLocale]}
            </option>
          )
        })}
      </select>
    </label>
  )
}
