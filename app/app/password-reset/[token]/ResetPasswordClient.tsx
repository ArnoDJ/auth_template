"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { FormEvent, useMemo, useState } from "react"
import { LanguageSwitcher } from "../../components/LanguageSwitcher"
import { useI18n } from "../../providers/I18nProvider"
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

export const ResetPasswordClient = () => {
  const { t } = useI18n()
  const params = useParams<{ token: string }>()
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    []
  )

  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const token = params.token

  if (success) {
    return (
      <main className={styles.shell}>
        <section className={styles.modalCard}>
          <LanguageSwitcher />
          <p className={styles.kicker}>{t("resetPassword.kicker")}</p>
          <h1>{t("resetPassword.successTitle")}</h1>
          <p className={styles.lead}>{success}</p>
          <Link className={styles.primaryAction} href="/login">
            {t("common.goToLogin")}
          </Link>
        </section>
      </main>
    )
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!token) {
      setError(t("resetPassword.missingToken"))
      return
    }

    if (password !== passwordConfirmation) {
      setError(t("resetPassword.passwordMismatch"))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiUrl}/auth/password-reset/${token}`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          password,
          passwordConfirmation
        })
      })

      if (!response.ok) {
        setError(await getErrorMessage(response, t("resetPassword.errorDefault")))
        return
      }

      setSuccess(t("resetPassword.success"))
      setPassword("")
      setPasswordConfirmation("")
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
        <p className={styles.kicker}>{t("resetPassword.kicker")}</p>
        <h1>{t("resetPassword.title")}</h1>
        <p className={styles.lead}>{t("resetPassword.lead")}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>{t("resetPassword.password")}</span>
            <div className={styles.passwordWrap}>
              <input
                className={styles.passwordInput}
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder={t("resetPassword.passwordPlaceholder")}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                }}
                required
              />
              <button
                className={styles.passwordToggle}
                type="button"
                aria-label={
                  showPassword
                    ? t("common.hidePassword")
                    : t("common.showPassword")
                }
                onClick={() => {
                  setShowPassword((value) => !value)
                }}
              >
                <span className={styles.eyeIcon} aria-hidden="true">
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 4.5L20 21"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10.58 10.58A2 2 0 0013.42 13.42"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9.88 5.09A10.94 10.94 0 0112 4.9c5.3 0 8.73 3.4 10 7.1a11.96 11.96 0 01-3.16 4.93M6.65 7.65A12.17 12.17 0 002 12c1.27 3.7 4.7 7.1 10 7.1 1.77 0 3.34-.38 4.72-1.01"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2 12c1.27-3.7 4.7-7.1 10-7.1S20.73 8.3 22 12c-1.27 3.7-4.7 7.1-10 7.1S3.27 15.7 2 12Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3.1"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </label>

          <label className={styles.field}>
            <span>{t("resetPassword.confirmPassword")}</span>
            <div className={styles.passwordWrap}>
              <input
                className={styles.passwordInput}
                type={showPasswordConfirmation ? "text" : "password"}
                name="passwordConfirmation"
                autoComplete="new-password"
                placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                value={passwordConfirmation}
                onChange={(event) => {
                  setPasswordConfirmation(event.target.value)
                }}
                required
              />
              <button
                className={styles.passwordToggle}
                type="button"
                aria-label={
                  showPasswordConfirmation
                    ? t("common.hidePassword")
                    : t("common.showPassword")
                }
                onClick={() => {
                  setShowPasswordConfirmation((value) => !value)
                }}
              >
                <span className={styles.eyeIcon} aria-hidden="true">
                  {showPasswordConfirmation ? (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 4.5L20 21"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10.58 10.58A2 2 0 0013.42 13.42"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9.88 5.09A10.94 10.94 0 0112 4.9c5.3 0 8.73 3.4 10 7.1a11.96 11.96 0 01-3.16 4.93M6.65 7.65A12.17 12.17 0 002 12c1.27 3.7 4.7 7.1 10 7.1 1.77 0 3.34-.38 4.72-1.01"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2 12c1.27-3.7 4.7-7.1 10-7.1S20.73 8.3 22 12c-1.27 3.7-4.7 7.1-10 7.1S3.27 15.7 2 12Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3.1"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}

          <button className={styles.submit} type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t("resetPassword.submitting")
              : t("resetPassword.submit")}
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/login">{t("common.goToLogin")}</Link>
          <Link href="/forgot-password">{t("login.forgotPassword")}</Link>
        </div>
      </section>
    </main>
  )
}
