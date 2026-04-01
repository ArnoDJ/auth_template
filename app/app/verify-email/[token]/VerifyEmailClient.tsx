"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import styles from "./page.module.css"

type VerificationState = "loading" | "success" | "error"

type VerificationResponse = {
  message?: string
}

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { message?: unknown }

    if (typeof body.message === "string") {
      return body.message
    }
  } catch {
    return "Unable to verify your email right now."
  }

  return "Unable to verify your email right now."
}

export const VerifyEmailClient = () => {
  const params = useParams<{ token: string }>()
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    []
  )

  const [state, setState] = useState<VerificationState>("loading")
  const [message, setMessage] = useState("Verifying your email address...")

  useEffect(() => {
    const token = params.token
    if (!token) {
      return
    }

    void (async () => {
      try {
        const response = await fetch(`${apiUrl}/auth/verify-email/${token}`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({})
        })

        if (!response.ok) {
          setState("error")
          setMessage(await getErrorMessage(response))
          return
        }

        const body = (await response.json()) as VerificationResponse
        setState("success")
        setMessage(body.message ?? "Your email has been verified.")
      } catch {
        setState("error")
        setMessage("Unable to reach the API. Check that the backend is running.")
      }
    })()
  }, [apiUrl, params.token])

  if (!params.token) {
    return (
      <div className={styles.page}>
        <section className={styles.panel}>
          <p className={styles.kicker}>Email Verification</p>
          <h1>This verification link could not be completed.</h1>
          <p className={`${styles.message} ${styles.error}`}>
            Verification token is missing.
          </p>

          <div className={styles.actions}>
            <Link className={styles.primary} href="/register">
              Back to register
            </Link>
            <Link className={styles.secondary} href="/login">
              Go to login
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.kicker}>Email Verification</p>
        <h1>
          {state === "loading"
            ? "Checking your verification link."
            : state === "success"
              ? "Your account is ready."
              : "This verification link could not be completed."}
        </h1>
        <p
          className={
            state === "error" ? `${styles.message} ${styles.error}` : styles.message
          }
        >
          {message}
        </p>

        <div className={styles.actions}>
          <Link className={styles.primary} href="/login">
            Go to login
          </Link>
          <Link className={styles.secondary} href="/register">
            Back to register
          </Link>
        </div>
      </section>
    </div>
  )
}
