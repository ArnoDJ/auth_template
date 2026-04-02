"use client"

import { LanguageSwitcher } from "../components/LanguageSwitcher"
import styles from "../page.module.css"

type HomeLoadingStateProps = {
  t: (key: string) => string
}

export const HomeLoadingState = ({ t }: HomeLoadingStateProps) => {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <LanguageSwitcher />
        <p className={styles.kicker}>{t("home.loadingKicker")}</p>
        <h1>{t("home.loadingTitle")}</h1>
        <p className={styles.lead}>{t("home.loadingLead")}</p>
      </section>
    </div>
  )
}
