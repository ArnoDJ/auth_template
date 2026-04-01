"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { LanguageSwitcher } from "../components/LanguageSwitcher"
import { useAuth } from "../providers/AuthProvider"
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

export const RegisterForm = () => {
  const router = useRouter()
  const { t } = useI18n()
  const { isAuthenticated, isHydrated } = useAuth()
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    []
  )

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, isHydrated, router])

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault()
    setError("")

    if (password !== passwordConfirmation) {
      setError(t("register.passwordMismatch"))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          passwordConfirmation
        })
      })

      if (!response.ok) {
        setError(await getErrorMessage(response, t("register.errorDefault")))
        return
      }

      router.push(`/check-email?email=${encodeURIComponent(email.trim())}`)
    } catch {
      setError(t("common.unreachableApi"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isHydrated && isAuthenticated) {
    return null
  }

  return (
    <div className={styles.shell}>
      <section className={styles.brandPanel}>
        <LanguageSwitcher />
        <p className={styles.kicker}>{t("register.brand")}</p>
        <h1>{t("register.title")}</h1>
        <p className={styles.lead}>{t("register.lead")}</p>

        <div className={styles.notes}>
          <div className={styles.noteCard}>
            <span>API</span>
            <strong>{apiUrl}</strong>
            <p>{t("common.apiConfigured")}</p>
          </div>
          <div className={styles.noteCard}>
            <span>{t("register.flowLabel")}</span>
            <strong>{t("register.flowValue")}</strong>
            <p>{t("register.flowDesc")}</p>
          </div>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <p className={styles.eyebrow}>{t("register.headerTag")}</p>
            <h2>{t("register.headerTitle")}</h2>
            <p>{t("register.headerDesc")}</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
              <label className={styles.field}>
                <span>{t("register.firstName")}</span>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Tony"
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value)
                  }}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>{t("register.lastName")}</span>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Stark"
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value)
                  }}
                  required
                />
              </label>
            </div>

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
              <span>{t("register.password")}</span>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder={t("register.passwordPlaceholder")}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                }}
                required
              />
            </label>

            <label className={styles.field}>
              <span>{t("register.confirmPassword")}</span>
              <input
                type="password"
                name="passwordConfirmation"
                autoComplete="new-password"
                placeholder={t("register.confirmPasswordPlaceholder")}
                value={passwordConfirmation}
                onChange={(event) => {
                  setPasswordConfirmation(event.target.value)
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
              {isSubmitting ? t("register.submitting") : t("register.submit")}
            </button>
          </form>

          <div className={styles.footerLinks}>
            <Link href="/login">{t("register.alreadyAccount")}</Link>
            <span>{t("register.verifyInfo")}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
