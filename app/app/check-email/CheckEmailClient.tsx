"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "../components/Button"
import { useI18n } from "../providers/I18nProvider"
import styles from "./page.module.css"

type CheckEmailClientProps = {
  email: string | null
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

export const CheckEmailClient = ({ email }: CheckEmailClientProps) => {
  const { t, locale, locales, setLocale } = useI18n()
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(email)
  const [feedbackType, setFeedbackType] = useState<"success" | "error">(
    "success"
  )

  useEffect(() => {
    const browserLocale = window.navigator.language.toLowerCase().split("-")[0]
    const nextLocale = locales.includes(browserLocale as (typeof locales)[number])
      ? (browserLocale as (typeof locales)[number])
      : "en"

    if (nextLocale !== locale) {
      setLocale(nextLocale)
    }
  }, [locale, locales, setLocale])

  useEffect(() => {
    if (email) {
      setResolvedEmail(email)
      return
    }

    const queryEmail = new URLSearchParams(window.location.search).get("email")
    setResolvedEmail(
      queryEmail && queryEmail.trim().length > 0 ? queryEmail : null
    )
  }, [email])

  const handleResend = async (): Promise<void> => {
    if (!resolvedEmail || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setFeedback("")

    try {
      const response = await fetch(`${apiUrl}/auth/resend-verification-email`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email: resolvedEmail })
      })

      if (!response.ok) {
        setFeedbackType("error")
        setFeedback(await getErrorMessage(response, t("checkEmail.resendError")))
        return
      }

      setFeedbackType("success")
      setFeedback(t("checkEmail.resendSuccess"))
    } catch {
      setFeedbackType("error")
      setFeedback(t("common.unreachableApi"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <h1>{t("checkEmail.title")}</h1>
        <p className={styles.lead}>{t("checkEmail.lead")}</p>

        {resolvedEmail ? (
          <p className={styles.target}>
            {t("checkEmail.sentTo")} <strong>{resolvedEmail}</strong>
          </p>
        ) : null}

        <ol className={styles.steps}>
          <li>{t("checkEmail.step1")}</li>
          <li>{t("checkEmail.step2")}</li>
          <li>{t("checkEmail.step3")}</li>
        </ol>

        {feedback ? (
          <p
            className={
              feedbackType === "error"
                ? `${styles.feedback} ${styles.error}`
                : styles.feedback
            }
          >
            {feedback}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button
            variant="secondary"
            type="button"
            onClick={handleResend}
            disabled={!resolvedEmail || isSubmitting}
          >
            {isSubmitting ? t("checkEmail.resending") : t("checkEmail.resend")}
          </Button>
          <Button variant="primary" href="/login">
            {t("common.goToLogin")}
          </Button>
        </div>
      </section>
    </main>
  )
}
