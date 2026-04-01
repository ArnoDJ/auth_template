"use client"

import Link from "next/link"
import { useAuth } from "./providers/AuthProvider"
import styles from "./page.module.css"

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export const HomeContent = () => {
  const { accessToken, clearAccessToken, isAuthenticated, isHydrated } =
    useAuth()

  if (!isHydrated) {
    return (
      <div className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Loading Session</p>
          <h1>Checking your local auth state.</h1>
          <p className={styles.lead}>
            The frontend is restoring the client session before deciding which
            surface to show.
          </p>
        </section>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Next.js Frontend</p>
          <h1>BK Connect now has a frontend shell ready to grow.</h1>
          <p className={styles.lead}>
            This app is set up with the Next.js App Router, TypeScript, and
            ESLint. It is ready to connect to the Nest API and become the main
            client surface for authentication, onboarding, and account flows.
          </p>

          <div className={styles.cards}>
            <div className={styles.card}>
              <span>API Target</span>
              <strong>{apiUrl}</strong>
              <p>Configured through <code>NEXT_PUBLIC_API_URL</code>.</p>
            </div>

            <div className={styles.card}>
              <span>Core Stack</span>
              <strong>Next.js App Router</strong>
              <p>Server-first rendering with client components where needed.</p>
            </div>
          </div>

          <div className={styles.actions}>
            <Link className={styles.primary} href="/login">
              Open login
            </Link>
            <Link className={styles.secondary} href="/register">
              Open register
            </Link>
            <a
              className={styles.tertiary}
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Next.js Docs
            </a>
            <a
              className={styles.quaternary}
              href="https://react.dev/learn"
              target="_blank"
              rel="noopener noreferrer"
            >
              React Docs
            </a>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.dashboard}>
        <div className={styles.dashboardHeader}>
          <div>
            <p className={styles.kicker}>Authenticated</p>
            <h1>Main page</h1>
            <p className={styles.lead}>
              The client auth context is active. This is where the actual
              application shell should live next.
            </p>
          </div>

          <button className={styles.secondaryButton} onClick={clearAccessToken}>
            Sign out
          </button>
        </div>

        <div className={styles.dashboardGrid}>
          <div className={styles.card}>
            <span>Session State</span>
            <strong>Access token stored</strong>
            <p>The browser restored the session from local storage.</p>
          </div>

          <div className={styles.card}>
            <span>API Target</span>
            <strong>{apiUrl}</strong>
            <p>The frontend is still configured to call your Nest backend.</p>
          </div>

          <div className={styles.cardWide}>
            <span>Access Token Preview</span>
            <code>{accessToken?.slice(0, 96)}...</code>
          </div>
        </div>
      </section>
    </div>
  )
}
