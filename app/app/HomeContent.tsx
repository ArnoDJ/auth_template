"use client"

import Link from "next/link"
import { LanguageSwitcher } from "./components/LanguageSwitcher"
import { useAuth } from "./providers/AuthProvider"
import { useI18n } from "./providers/I18nProvider"
import styles from "./page.module.css"

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export const HomeContent = () => {
  const { t } = useI18n()
  const { accessToken, clearAccessToken, isAuthenticated, isHydrated } =
    useAuth()

  if (!isHydrated) {
    return (
      <div className={styles.page}>
        <section className={styles.hero}>
          <LanguageSwitcher />
          <p className={styles.kicker}>{t("home.loadingKicker")}</p>
          <h1>{t("home.loadingTitle")}</h1>
          <p className={styles.lead}>
            {t("home.loadingLead")}
          </p>
        </section>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <section className={styles.hero}>
          <LanguageSwitcher />
          <p className={styles.kicker}>{t("home.guestKicker")}</p>
          <h1>{t("home.guestTitle")}</h1>
          <p className={styles.lead}>{t("home.guestLead")}</p>

          <div className={styles.cards}>
            <div className={styles.card}>
              <span>{t("home.apiTargetLabel")}</span>
              <strong>{apiUrl}</strong>
              <p>
                {t("common.apiConfigured")
                  .split("`NEXT_PUBLIC_API_URL`")
                  .map((part, index, allParts) => {
                    if (index === allParts.length - 1) {
                      return part
                    }

                    return (
                      <span key={`${part}-${index}`}>
                        {part}
                        <code>NEXT_PUBLIC_API_URL</code>
                      </span>
                    )
                  })}
              </p>
            </div>

            <div className={styles.card}>
              <span>{t("home.coreStackLabel")}</span>
              <strong>{t("home.coreStackValue")}</strong>
              <p>{t("home.coreStackDesc")}</p>
            </div>
          </div>

          <div className={styles.actions}>
            <Link className={styles.primary} href="/login">
              {t("home.openLogin")}
            </Link>
            <Link className={styles.secondary} href="/register">
              {t("home.openRegister")}
            </Link>
            <a
              className={styles.tertiary}
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("home.nextDocs")}
            </a>
            <a
              className={styles.quaternary}
              href="https://react.dev/learn"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("home.reactDocs")}
            </a>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.dashboard}>
        <div className={styles.dashboardHeader}>
          <div>
            <LanguageSwitcher />
            <p className={styles.kicker}>{t("home.authKicker")}</p>
            <h1>{t("home.authTitle")}</h1>
            <p className={styles.lead}>{t("home.authLead")}</p>
          </div>

          <button className={styles.secondaryButton} onClick={clearAccessToken}>
            {t("home.signOut")}
          </button>
        </div>

        <div className={styles.dashboardGrid}>
          <div className={styles.card}>
            <span>{t("home.sessionStateLabel")}</span>
            <strong>{t("home.sessionStateValue")}</strong>
            <p>{t("home.sessionStateDesc")}</p>
          </div>

          <div className={styles.card}>
            <span>{t("home.apiTargetLabel")}</span>
            <strong>{apiUrl}</strong>
            <p>{t("home.apiTargetDesc")}</p>
          </div>

          <div className={styles.cardWide}>
            <span>{t("home.tokenPreviewLabel")}</span>
            <code>{accessToken?.slice(0, 96)}...</code>
          </div>
        </div>
      </section>
    </div>
  )
}
