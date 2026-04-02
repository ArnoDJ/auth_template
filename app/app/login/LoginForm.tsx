"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { LanguageSwitcher } from "../components/LanguageSwitcher"
import { useAuth } from "../providers/AuthProvider"
import { useI18n } from "../providers/I18nProvider"
import styles from "./page.module.css"

type LoginResponse = {
  accessToken?: string
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

export const LoginForm = () => {
  const router = useRouter()
  const { t } = useI18n()
  const { isAuthenticated, isHydrated, setAccessToken } = useAuth()
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    []
  )

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiUrl}/auth/token`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password
        })
      })

      if (!response.ok) {
        setError(await getErrorMessage(response, t("login.errorDefault")))
        return
      }

      const body = (await response.json()) as LoginResponse
      if (!body.accessToken) {
        setError(t("login.errorNoToken"))
        return
      }

      setAccessToken(body.accessToken)
      router.push("/")
    } catch {
      setError(t("common.unreachableApi"))
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, isHydrated, router])

  if (isHydrated && isAuthenticated) {
    return null
  }

  return (
    <div className={styles.shell}>
      <section className={styles.brandPanel}>
        <LanguageSwitcher />
        <p className={styles.kicker}>{t("login.brand")}</p>
        <h1>{t("login.title")}</h1>
        <p className={styles.lead}>{t("login.lead")}</p>

        <div className={styles.notes}>
          <div className={styles.noteCard}>
            <span>API</span>
            <strong>{apiUrl}</strong>
            <p>{t("common.apiConfigured")}</p>
          </div>
          <div className={styles.noteCard}>
            <span>{t("login.flowLabel")}</span>
            <strong>{t("login.flowValue")}</strong>
            <p>{t("login.flowDesc")}</p>
          </div>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <p className={styles.eyebrow}>{t("login.headerTag")}</p>
            <h2>{t("login.headerTitle")}</h2>
            <p>{t("login.headerDesc")}</p>
          </div>

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

            <label className={styles.field}>
              <span>{t("login.password")}</span>
              <div className={styles.passwordWrap}>
                <input
                  className={styles.passwordInput}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder={t("login.passwordPlaceholder")}
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

            <Link className={styles.auxLink} href="/forgot-password">
              {t("login.forgotPassword")}
            </Link>

            {error ? <p className={styles.error}>{error}</p> : null}
            <button
              className={styles.submit}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("login.submitting") : t("login.submit")}
            </button>
          </form>

          <div className={styles.footerLinks}>
            <Link href="/register">{t("login.createAccount")}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
