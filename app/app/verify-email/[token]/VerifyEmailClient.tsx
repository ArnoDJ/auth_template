"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { LanguageSwitcher } from "../../components/LanguageSwitcher"
import { useI18n } from "../../providers/I18nProvider"
import styles from "./page.module.css"

type VerificationState = "loading" | "success" | "error"

type VerificationResponse = {
  message?: string
}

const getErrorMessage = async (
  response: Response,
  fallback: string
): Promise<string> => {
  try {
    const body = (await response.json()) as { message?: unknown }

    if (typeof body.message === "string") {
      return body.message
    }
  } catch {
    return fallback
  }

  return fallback
}

export const VerifyEmailClient = () => {
  const { t } = useI18n()
  const params = useParams<{ token: string }>()
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    []
  )

  const [state, setState] = useState<VerificationState>("loading")
  const [message, setMessage] = useState(t("verify.loadingMessage"))

  useEffect(() => {
    const token = params.token
    if (!token) {
      return
    }

    void (async () => {
      try {
        const response = await fetch(`${apiUrl}/auth/verify-email/${token}`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({})
        })

        if (!response.ok) {
          setState("error")
          setMessage(await getErrorMessage(response, t("verify.errorDefault")))
          return
        }

        const body = (await response.json()) as VerificationResponse
        setState("success")
        setMessage(body.message ?? t("verify.successMessage"))
      } catch {
        setState("error")
        setMessage(t("common.unreachableApi"))
      }
    })()
  }, [apiUrl, params.token, t])

  if (!params.token) {
    return (
      <div className={styles.page}>
        <section className={styles.panel}>
          <LanguageSwitcher />
          <p className={styles.kicker}>{t("verify.kicker")}</p>
          <h1>{t("verify.missingTitle")}</h1>
          <p className={`${styles.message} ${styles.error}`}>
            {t("verify.missingToken")}
          </p>

          <div className={styles.actions}>
            <Link className={styles.primary} href="/register">
              {t("common.backToRegister")}
            </Link>
            <Link className={styles.secondary} href="/login">
              {t("common.goToLogin")}
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <LanguageSwitcher />
        <p className={styles.kicker}>{t("verify.kicker")}</p>
        <h1>
          {state === "loading"
            ? t("verify.loadingTitle")
            : state === "success"
              ? t("verify.successTitle")
              : t("verify.errorTitle")}
        </h1>
        <p
          className={
            state === "error" ? `${styles.message} ${styles.error}` : styles.message
          }
        >
          {message}
        </p>

        <div className={styles.actions}>
          <Link className={styles.primary} href="/login">
            {t("common.goToLogin")}
          </Link>
          <Link className={styles.secondary} href="/register">
            {t("common.backToRegister")}
          </Link>
        </div>
      </section>
    </div>
  )
}
