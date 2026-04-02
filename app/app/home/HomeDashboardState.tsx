"use client"

import { useState } from "react"
import { DashboardSidebar } from "./DashboardSidebar"
import styles from "../page.module.css"

type HomeDashboardStateProps = {
  accessToken: string | null
  apiUrl: string
  onLogout: () => void
  t: (key: string) => string
}

export const HomeDashboardState = ({
  accessToken,
  apiUrl,
  onLogout,
  t
}: HomeDashboardStateProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className={`${styles.page} ${styles.pageDashboard}`}>
      <section
        className={`${styles.dashboard} ${isSidebarCollapsed ? styles.dashboardCollapsed : ""}`}
      >
        <DashboardSidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => {
            setIsSidebarCollapsed((value) => !value)
          }}
          onLogout={onLogout}
          signOutLabel={t("home.signOut")}
          profileLabel={t("home.profile")}
          profileName="Arno De Jonghe"
          profileMeta="Profile settings"
        />

        <div className={styles.dashboardMain}>
          <div className={styles.dashboardHeader}>
            <div>
              <p className={styles.kicker}>{t("home.authKicker")}</p>
              <h1>{t("home.authTitle")}</h1>
              <p className={styles.lead}>{t("home.authLead")}</p>
            </div>
          </div>

          <div className={styles.dashboardGrid}>
            <div className={styles.card}>
              <span>{t("home.sessionStateLabel")}</span>
              <strong>{t("home.sessionStateValue")}</strong>
              <p>{t("home.sessionStateDesc")}</p>
            </div>

            <div className={styles.card}>
              <span>{t("home.apiTargetLabel")}</span>
              <strong>{apiUrl}</strong>
              <p>{t("home.apiTargetDesc")}</p>
            </div>

            <div className={styles.cardWide}>
              <span>{t("home.tokenPreviewLabel")}</span>
              <code>{accessToken?.slice(0, 96)}...</code>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
