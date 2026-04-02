"use client"

import Link from "next/link"
import { FormEvent, useMemo, useState } from "react"
import { LanguageSwitcher } from "../components/LanguageSwitcher"
import { useI18n } from "../providers/I18nProvider"
import styles from "./page.module.css"

const getErrorMessage = async (
  response: Response,
  fallback: string
): Promise<string> => {
  try {
    const body = (await response.json()) as { message?: unknown }

    if (typeof body.message === "string") {
      return body.message
    }

    if (Array.isArray(body.message)) {
      const firstMessage = body.message.find(
        (message): message is string => typeof message === "string"
      )

      if (firstMessage) {
        return firstMessage
      }
    }
  } catch {
    return fallback
  }

  return fallback
}

export const ForgotPasswordForm = () => {
  const { t } = useI18n()
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    []
  )

  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiUrl}/auth/password-reset/request`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        setError(
          await getErrorMessage(response, t("forgotPassword.errorDefault"))
        )
        return
      }

      setSuccess(t("forgotPassword.success"))
    } catch {
      setError(t("common.unreachableApi"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <LanguageSwitcher />
        <p className={styles.kicker}>{t("forgotPassword.kicker")}</p>
        <h1>{t("forgotPassword.title")}</h1>
        <p className={styles.lead}>{t("forgotPassword.lead")}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>{t("login.email")}</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
              }}
              required
            />
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}
          {success ? <p className={styles.success}>{success}</p> : null}

          <button className={styles.submit} type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t("forgotPassword.submitting")
              : t("forgotPassword.submit")}
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/login">{t("common.goToLogin")}</Link>
          <Link href="/register">{t("login.createAccount")}</Link>
        </div>
      </section>
    </main>
  )
}
