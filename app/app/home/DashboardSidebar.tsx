"use client"

import Link from "next/link"
import { useState } from "react"
import styles from "../page.module.css"

type DashboardSidebarProps = {
  isCollapsed: boolean
  onToggle: () => void
  onLogout: () => void
  signOutLabel: string
  profileLabel: string
  profileName: string
  profileMeta: string
}

export const DashboardSidebar = ({
  isCollapsed,
  onToggle,
  onLogout,
  signOutLabel,
  profileLabel,
  profileName,
  profileMeta
}: DashboardSidebarProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTop}>
        <button
          className={styles.sidebarToggle}
          type="button"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggle}
        >
          <span />
          <span />
          <span />
        </button>

        {!isCollapsed ? (
          <>
            <p className={styles.sidebarBrand}>Auth Template</p>
            <nav className={styles.sidebarNav}>
              <a className={styles.sidebarItem} href="#">
                <span className={styles.sidebarItemIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 7.5a2 2 0 0 1 2-2h5l1.2 1.8H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className={styles.sidebarItemLabel}>Projects</span>
              </a>
            </nav>
          </>
        ) : null}
      </div>

      <div className={styles.sidebarBottom}>
        <button
          className={styles.sidebarProfile}
          type="button"
          aria-expanded={isProfileOpen}
          aria-haspopup="menu"
          onClick={() => {
            setIsProfileOpen((value) => !value)
          }}
        >
          <span className={styles.sidebarItemIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M5 19c1.2-3 3.8-4.8 7-4.8s5.8 1.8 7 4.8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          {!isCollapsed ? (
            <span className={styles.sidebarProfileText}>
              <strong>{profileName}</strong>
              <small>{profileMeta}</small>
            </span>
          ) : null}
          {!isCollapsed ? (
            <span
              className={`${styles.sidebarProfileChevron} ${isProfileOpen ? styles.sidebarProfileChevronOpen : ""}`}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 10l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ) : null}
        </button>

        {isProfileOpen ? (
          <div className={styles.sidebarDropdown} role="menu">
            <Link className={styles.sidebarDropdownItem} href="/profile">
              {profileLabel}
            </Link>
            <button
              className={styles.sidebarDropdownItem}
              type="button"
              onClick={onLogout}
            >
              {signOutLabel}
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
