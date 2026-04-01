"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import styles from "./page.module.css"

type CheckEmailClientProps = {
  email: string | null
}

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { message?: unknown }
    if (typeof body.message === "string") {
      return body.message
    }
  } catch {
    return "Unable to resend verification email right now."
  }

  return "Unable to resend verification email right now."
}

export const CheckEmailClient = ({ email }: CheckEmailClientProps) => {
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
        setFeedback(await getErrorMessage(response))
        return
      }

      setFeedbackType("success")
      setFeedback(
        "If your account is still unverified, a new verification email has been sent."
      )
    } catch {
      setFeedbackType("error")
      setFeedback("Unable to reach the API. Check that the backend is running.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <p className={styles.kicker}>Registration complete</p>
        <h1>Check your email</h1>
        <p className={styles.lead}>
          We sent a verification link to your inbox. Open the email and click
          the link to activate your account.
        </p>

        {email ? (
          <p className={styles.target}>
            Sent to: <strong>{email}</strong>
          </p>
        ) : null}

        <ol className={styles.steps}>
          <li>Open your inbox.</li>
          <li>Check spam or junk if you do not see it in a minute.</li>
          <li>Click the verification link, then sign in.</li>
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
            {isSubmitting ? "Resending..." : "Resend verification email"}
          </button>
          <Link className={styles.primary} href="/login">
            Go to login
          </Link>
          <Link className={styles.secondary} href="/register">
            Back to register
          </Link>
        </div>
      </section>
    </main>
  )
}
