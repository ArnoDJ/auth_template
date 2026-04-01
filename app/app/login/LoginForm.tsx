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
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder={t("login.passwordPlaceholder")}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                }}
                required
              />
            </label>

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
            <Link href="/">{t("common.backToHome")}</Link>
            <Link href="/register">{t("login.createAccount")}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
