"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
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
  const { t, locale, locales, setLocale } = useI18n()
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

  useEffect(() => {
    const browserLocale = window.navigator.language.toLowerCase().split("-")[0]
    const nextLocale = locales.includes(browserLocale as (typeof locales)[number])
      ? (browserLocale as (typeof locales)[number])
      : "en"

    if (nextLocale !== locale) {
      setLocale(nextLocale)
    }
  }, [locale, locales, setLocale])

  if (isHydrated && isAuthenticated) {
    return null
  }

  return (
    <div className={styles.shell}>
      <section className={styles.brandPanel}>
        <h1>{t("login.title")}</h1>
        <p className={styles.lead}>{t("login.lead")}</p>
        <div className={styles.brandVector} aria-hidden="true">
          <svg viewBox="0 0 680 520" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="tealGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1f5f57" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0f3b41" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <rect width="680" height="520" fill="transparent" />
            <circle cx="152" cy="106" r="118" fill="url(#tealGlow)" />
            <circle cx="342" cy="420" r="128" fill="url(#tealGlow)" />
            <path
              d="M0 356C120 296 218 264 318 276c86 10 165 44 362 190V520H0Z"
              fill="#11444a"
              fillOpacity="0.78"
            />
            <path
              d="M0 408c172-46 258-58 364-10 84 40 124 72 316 122"
              stroke="#69b7a7"
              strokeOpacity="0.5"
              strokeWidth="2.2"
              fill="none"
            />
            <path
              d="M118 168c36-24 64-28 93-11 20 12 32 30 59 46 29 17 59 13 89-12"
              stroke="#8dd8c8"
              strokeOpacity="0.62"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>{t("login.headerTitle")}</h2>
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
