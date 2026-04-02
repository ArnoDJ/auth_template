"use client"

import Link from "next/link"
import { LanguageSwitcher } from "../components/LanguageSwitcher"
import styles from "../page.module.css"

type HomeGuestStateProps = {
  apiUrl: string
  t: (key: string) => string
}

export const HomeGuestState = ({ apiUrl, t }: HomeGuestStateProps) => {
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
