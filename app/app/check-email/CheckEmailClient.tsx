"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { LanguageSwitcher } from "../components/LanguageSwitcher"
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
  const { t } = useI18n()
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [feedbackType, setFeedbackType] = useState<"success" | "error">(
    "success"
  )

  const handleResend = async (): Promise<void> => {
    if (!email || isSubmitting) {
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
        body: JSON.stringify({ email })
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
        <LanguageSwitcher />
        <p className={styles.kicker}>{t("checkEmail.kicker")}</p>
        <h1>{t("checkEmail.title")}</h1>
        <p className={styles.lead}>{t("checkEmail.lead")}</p>

        {email ? (
          <p className={styles.target}>
            {t("checkEmail.sentTo")} <strong>{email}</strong>
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
          <button
            className={styles.ghost}
            type="button"
            onClick={handleResend}
            disabled={!email || isSubmitting}
          >
            {isSubmitting ? t("checkEmail.resending") : t("checkEmail.resend")}
          </button>
          <Link className={styles.primary} href="/login">
            {t("common.goToLogin")}
          </Link>
          <Link className={styles.secondary} href="/register">
            {t("common.backToRegister")}
          </Link>
        </div>
      </section>
    </main>
  )
}
