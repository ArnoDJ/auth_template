"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useAuth } from "../providers/AuthProvider"
import styles from "./page.module.css"

type LoginResponse = {
  accessToken?: string
}

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
    return "Unable to sign in right now. Try again."
  }

  return "Unable to sign in right now. Try again."
}

export const LoginForm = () => {
  const router = useRouter()
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
        setError(await getErrorMessage(response))
        return
      }

      const body = (await response.json()) as LoginResponse
      if (!body.accessToken) {
        setError("Login succeeded but no access token was returned.")
        return
      }

      setAccessToken(body.accessToken)
      router.push("/")
    } catch {
      setError("Unable to reach the API. Check that the backend is running.")
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
        <p className={styles.kicker}>BK Connect</p>
        <h1>Sign in to continue working inside your account.</h1>
        <p className={styles.lead}>
          This page talks directly to the Nest auth API, sends cookies with the
          request, and gives you a clean place to wire the next part of the app.
        </p>

        <div className={styles.notes}>
          <div className={styles.noteCard}>
            <span>API</span>
            <strong>{apiUrl}</strong>
            <p>Configured through `NEXT_PUBLIC_API_URL`.</p>
          </div>
          <div className={styles.noteCard}>
            <span>Flow</span>
            <strong>POST /auth/token</strong>
            <p>Expects the same email and password pair your backend accepts.</p>
          </div>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <p className={styles.eyebrow}>Authentication</p>
            <h2>Login</h2>
            <p>Use a valid account from the BK Connect backend.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
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
                autoComplete="current-password"
                placeholder="Enter your password"
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
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className={styles.footerLinks}>
            <Link href="/">Back to home</Link>
            <Link href="/register">Create an account</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
