"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useAuth } from "../providers/AuthProvider"
import styles from "./page.module.css"

const getErrorMessage = async (response: Response): Promise<string> => {
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
    return "Unable to create your account right now. Try again."
  }

  return "Unable to create your account right now. Try again."
}

export const RegisterForm = () => {
  const router = useRouter()
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
      setError("Password confirmation does not match.")
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
        setError(await getErrorMessage(response))
        return
      }

      router.push(`/check-email?email=${encodeURIComponent(email.trim())}`)
    } catch {
      setError("Unable to reach the API. Check that the backend is running.")
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
        <p className={styles.kicker}>Auth Template</p>
        <h1>Create an account and verify your email address.</h1>
        <p className={styles.lead}>
          Registration creates an inactive account, sends a verification email,
          and lets the user sign in only after the email address has been
          confirmed.
        </p>

        <div className={styles.notes}>
          <div className={styles.noteCard}>
            <span>API</span>
            <strong>{apiUrl}</strong>
            <p>Configured through `NEXT_PUBLIC_API_URL`.</p>
          </div>
          <div className={styles.noteCard}>
            <span>Flow</span>
            <strong>POST /auth/register</strong>
            <p>
              The backend sends a verification mail instead of logging the user
              in immediately.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <p className={styles.eyebrow}>Registration</p>
            <h2>Create account</h2>
            <p>After registration, the user must verify the email address.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
              <label className={styles.field}>
                <span>First name</span>
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
                <span>Last name</span>
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
              <span>Email</span>
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
              <span>Password</span>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                }}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Confirm password</span>
              <input
                type="password"
                name="passwordConfirmation"
                autoComplete="new-password"
                placeholder="Repeat your password"
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className={styles.footerLinks}>
            <Link href="/login">Already have an account?</Link>
            <span>Verification link opens the frontend verify-email page.</span>
          </div>
        </div>
      </section>
    </div>
  )
}
