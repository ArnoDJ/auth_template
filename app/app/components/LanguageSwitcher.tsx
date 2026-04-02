"use client"

import { ChangeEvent } from "react"
import styles from "./LanguageSwitcher.module.css"
import { useI18n } from "../providers/I18nProvider"

export const LanguageSwitcher = () => {
  const { locale, locales, setLocale } = useI18n()

  const handleChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setLocale(event.target.value as (typeof locales)[number])
  }

  return (
    <div className={styles.switcher}>
      <select
        className={styles.select}
        value={locale}
        onChange={handleChange}
        aria-label="Language selector"
      >
        {locales.map((availableLocale) => {
          return (
            <option key={availableLocale} value={availableLocale}>
              {availableLocale.toUpperCase()}
            </option>
          )
        })}
      </select>
    </div>
  )
}
