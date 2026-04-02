"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { LanguageSwitcher } from "../components/LanguageSwitcher"
import { DashboardSidebar } from "../home/DashboardSidebar"
import { useAuth } from "../providers/AuthProvider"
import { useI18n } from "../providers/I18nProvider"
import dashboardStyles from "../page.module.css"
import styles from "./page.module.css"

type CurrentUser = {
  id: string
  firstName: string
  lastName: string
  email: string
}

type ActiveProfileModal = "name" | "email" | "password" | null

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

const EyeIcon = ({ isVisible }: Readonly<{ isVisible: boolean }>) => {
  if (isVisible) {
    return (
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
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12c1.27-3.7 4.7-7.1 10-7.1S20.73 8.3 22 12c-1.27 3.7-4.7 7.1-10 7.1S3.27 15.7 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { t } = useI18n()
  const { isAuthenticated, isHydrated, clearAccessToken, accessToken } =
    useAuth()
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    []
  )
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showNewPasswordConfirmation, setShowNewPasswordConfirmation] =
    useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [activeModal, setActiveModal] = useState<ActiveProfileModal>(null)
  const [modalFirstName, setModalFirstName] = useState("")
  const [modalLastName, setModalLastName] = useState("")
  const [modalEmail, setModalEmail] = useState("")
  const [modalPassword, setModalPassword] = useState("")
  const [showModalPassword, setShowModalPassword] = useState(false)
  const [modalError, setModalError] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, isHydrated, router])

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !accessToken) {
      return
    }

    let isMounted = true

    const loadCurrentUser = async (): Promise<void> => {
      try {
        const response = await fetch(`${apiUrl}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        if (!response.ok) {
          return
        }

        const body = (await response.json()) as CurrentUser
        if (isMounted) {
          setCurrentUser(body)
          setModalFirstName(body.firstName)
          setModalLastName(body.lastName)
          setModalEmail(body.email)
        }
      } catch {
        return
      }
    }

    void loadCurrentUser()

    return () => {
      isMounted = false
    }
  }, [accessToken, apiUrl, isAuthenticated, isHydrated])

  const executePasswordChange = async (): Promise<void> => {
    setError("")
    setSuccess("")

    if (newPassword !== newPasswordConfirmation) {
      setError(t("profile.passwordMismatch"))
      return
    }

    if (!accessToken) {
      setError(t("common.unreachableApi"))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiUrl}/auth/change-password`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          newPasswordConfirmation
        })
      })

      if (!response.ok) {
        setError(await getErrorMessage(response, t("profile.errorDefault")))
        return
      }

      setSuccess(t("profile.passwordUpdated"))
      setCurrentPassword("")
      setNewPassword("")
      setNewPasswordConfirmation("")
    } catch {
      setError(t("common.unreachableApi"))
      return
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isHydrated || !isAuthenticated) {
    return null
  }

  const profileName =
    `${modalFirstName || currentUser?.firstName || ""} ${modalLastName || currentUser?.lastName || ""}`.trim() ||
    "User"
  const profileEmail = modalEmail || currentUser?.email || "-"
  const profileInitials = profileName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  const openNameModal = (): void => {
    setModalError("")
    setShowModalPassword(false)
    setModalFirstName(currentUser?.firstName ?? modalFirstName)
    setModalLastName(currentUser?.lastName ?? modalLastName)
    setModalPassword("")
    setActiveModal("name")
  }

  const openEmailModal = (): void => {
    setModalError("")
    setError("")
    setSuccess("")
    setShowModalPassword(false)
    setModalEmail(currentUser?.email ?? modalEmail)
    setModalPassword("")
    setActiveModal("email")
  }

  const openPasswordModal = (): void => {
    setModalError("")
    setError("")
    setSuccess("")
    setCurrentPassword("")
    setNewPassword("")
    setNewPasswordConfirmation("")
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowNewPasswordConfirmation(false)
    setActiveModal("password")
  }

  const closeModal = (): void => {
    setActiveModal(null)
    setModalError("")
    setError("")
    setSuccess("")
    setShowModalPassword(false)
    setModalPassword("")
  }

  const handleModalConfirm = (): void => {
    if (activeModal === "name") {
      if (!modalFirstName.trim() || !modalLastName.trim()) {
        setModalError(t("profile.modalNameRequired"))
        return
      }
      setCurrentUser((value) => {
        if (!value) {
          return value
        }
        return {
          ...value,
          firstName: modalFirstName.trim(),
          lastName: modalLastName.trim()
        }
      })
      closeModal()
      return
    }

    if (activeModal === "email") {
      if (!modalPassword.trim()) {
        setModalError(t("profile.modalPasswordRequired"))
        return
      }

      const normalizedEmail = modalEmail.trim()
      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        setModalError(t("profile.modalEmailInvalid"))
        return
      }
      setCurrentUser((value) => {
        if (!value) {
          return value
        }
        return {
          ...value,
          email: normalizedEmail
        }
      })
      closeModal()
    }
  }

  return (
    <div className={`${dashboardStyles.page} ${dashboardStyles.pageDashboard}`}>
      <section
        className={`${dashboardStyles.dashboard} ${isSidebarCollapsed ? dashboardStyles.dashboardCollapsed : ""}`}
      >
        <DashboardSidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => {
            setIsSidebarCollapsed((value) => !value)
          }}
          onLogout={clearAccessToken}
          signOutLabel={t("home.signOut")}
          profileLabel={t("home.profile")}
          profileName={profileName}
          profileMeta="Profile settings"
        />

        <div className={dashboardStyles.dashboardMain}>
          <section className={styles.profilePanel}>
            <h1>{t("profile.title")}</h1>

            <section className={styles.profileTop}>
              <section className={styles.profileIdentityHeader}>
                <div className={styles.profileAvatar} aria-hidden="true">
                  {profileInitials || "U"}
                </div>
                <button
                  className={styles.profileAvatarButton}
                  type="button"
                >
                  {t("profile.changePhoto")}
                </button>
              </section>

              <div className={styles.identityList}>
                <div className={styles.identityItem}>
                  <div className={styles.identityText}>
                    <span>{t("profile.name")}</span>
                    <strong>{profileName}</strong>
                  </div>
                  <button
                    className={styles.identityEdit}
                    type="button"
                    aria-label={t("profile.editNameTitle")}
                    onClick={openNameModal}
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M4 20h4l10.2-10.2a1.9 1.9 0 0 0 0-2.7l-1.3-1.3a1.9 1.9 0 0 0-2.7 0L4 16v4Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="m12.5 6.5 5 5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className={styles.identityItem}>
                  <div className={styles.identityText}>
                    <span>{t("profile.email")}</span>
                    <strong>{profileEmail}</strong>
                  </div>
                  <button
                    className={styles.identityEdit}
                    type="button"
                    aria-label={t("profile.editEmailTitle")}
                    onClick={openEmailModal}
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M4 20h4l10.2-10.2a1.9 1.9 0 0 0 0-2.7l-1.3-1.3a1.9 1.9 0 0 0-2.7 0L4 16v4Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="m12.5 6.5 5 5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </section>

            <section className={styles.settingsSection}>
              <h2>{t("profile.languageTitle")}</h2>
              <LanguageSwitcher />
            </section>

            <section className={styles.settingsSection}>
              <h2>{t("profile.passwordTitle")}</h2>
              <button
                className={styles.passwordModalTrigger}
                type="button"
                onClick={openPasswordModal}
              >
                {t("profile.passwordTitle")}
              </button>
            </section>

          </section>
        </div>
      </section>

      {activeModal ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={closeModal}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-edit-modal-title"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <button
              className={styles.modalClose}
              type="button"
              aria-label={t("profile.modalClose")}
              onClick={closeModal}
            >
              ×
            </button>

            <h2 id="profile-edit-modal-title">
              {activeModal === "email"
                ? t("profile.editEmailTitle")
                : activeModal === "name"
                  ? t("profile.editNameTitle")
                  : t("profile.passwordTitle")}
            </h2>

            <div className={styles.modalForm}>
              {activeModal === "email" ? (
                <>
                  <label className={styles.modalField}>
                    <span>{t("profile.newEmail")}</span>
                    <input
                      type="email"
                      value={modalEmail}
                      placeholder={t("profile.newEmailPlaceholder")}
                      onChange={(event) => {
                        setModalEmail(event.target.value)
                        setModalError("")
                      }}
                    />
                  </label>
                </>
              ) : activeModal === "name" ? (
                <>
                  <label className={styles.modalField}>
                    <span>{t("profile.firstName")}</span>
                    <input
                      type="text"
                      value={modalFirstName}
                      onChange={(event) => {
                        setModalFirstName(event.target.value)
                        setModalError("")
                      }}
                    />
                  </label>
                  <label className={styles.modalField}>
                    <span>{t("profile.lastName")}</span>
                    <input
                      type="text"
                      value={modalLastName}
                      onChange={(event) => {
                        setModalLastName(event.target.value)
                        setModalError("")
                      }}
                    />
                  </label>
                </>
              ) : (
                <div className={styles.form}>
                  <label className={styles.field}>
                    <span>{t("profile.currentPassword")}</span>
                    <div className={styles.passwordWrap}>
                      <input
                        className={styles.passwordInput}
                        type={showCurrentPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder={t("profile.currentPasswordPlaceholder")}
                        value={currentPassword}
                        onChange={(event) => {
                          setCurrentPassword(event.target.value)
                          setError("")
                        }}
                      />
                      <button
                        className={styles.passwordToggle}
                        type="button"
                        aria-label={
                          showCurrentPassword
                            ? t("common.hidePassword")
                            : t("common.showPassword")
                        }
                        onClick={() => {
                          setShowCurrentPassword((value) => !value)
                        }}
                      >
                        <span className={styles.eyeIcon} aria-hidden="true">
                          <EyeIcon isVisible={showCurrentPassword} />
                        </span>
                      </button>
                    </div>
                  </label>

                  <label className={styles.field}>
                    <span>{t("profile.newPassword")}</span>
                    <div className={styles.passwordWrap}>
                      <input
                        className={styles.passwordInput}
                        type={showNewPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder={t("profile.newPasswordPlaceholder")}
                        value={newPassword}
                        onChange={(event) => {
                          setNewPassword(event.target.value)
                          setError("")
                        }}
                      />
                      <button
                        className={styles.passwordToggle}
                        type="button"
                        aria-label={
                          showNewPassword
                            ? t("common.hidePassword")
                            : t("common.showPassword")
                        }
                        onClick={() => {
                          setShowNewPassword((value) => !value)
                        }}
                      >
                        <span className={styles.eyeIcon} aria-hidden="true">
                          <EyeIcon isVisible={showNewPassword} />
                        </span>
                      </button>
                    </div>
                  </label>

                  <label className={styles.field}>
                    <span>{t("profile.confirmPassword")}</span>
                    <div className={styles.passwordWrap}>
                      <input
                        className={styles.passwordInput}
                        type={showNewPasswordConfirmation ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder={t("profile.confirmPasswordPlaceholder")}
                        value={newPasswordConfirmation}
                        onChange={(event) => {
                          setNewPasswordConfirmation(event.target.value)
                          setError("")
                        }}
                      />
                      <button
                        className={styles.passwordToggle}
                        type="button"
                        aria-label={
                          showNewPasswordConfirmation
                            ? t("common.hidePassword")
                            : t("common.showPassword")
                        }
                        onClick={() => {
                          setShowNewPasswordConfirmation((value) => !value)
                        }}
                      >
                        <span className={styles.eyeIcon} aria-hidden="true">
                          <EyeIcon isVisible={showNewPasswordConfirmation} />
                        </span>
                      </button>
                    </div>
                  </label>
                </div>
              )}

              {activeModal === "email" ? (
                <label className={styles.modalField}>
                  <span>{t("profile.currentPassword")}</span>
                  <div className={styles.passwordWrap}>
                    <input
                      className={styles.passwordInput}
                      type={showModalPassword ? "text" : "password"}
                      value={modalPassword}
                      placeholder={t("profile.currentPasswordPlaceholder")}
                      onChange={(event) => {
                        setModalPassword(event.target.value)
                        setModalError("")
                      }}
                    />
                    <button
                      className={styles.passwordToggle}
                      type="button"
                      aria-label={
                        showModalPassword
                          ? t("common.hidePassword")
                          : t("common.showPassword")
                      }
                      onClick={() => {
                        setShowModalPassword((value) => !value)
                      }}
                    >
                      <span className={styles.eyeIcon} aria-hidden="true">
                        <EyeIcon isVisible={showModalPassword} />
                      </span>
                    </button>
                  </div>
                </label>
              ) : null}
            </div>

            {modalError ? <p className={styles.error}>{modalError}</p> : null}
            {error ? <p className={styles.error}>{error}</p> : null}
            {success ? <p className={styles.success}>{success}</p> : null}

            <div className={styles.modalActions}>
              <button className={styles.modalCancel} type="button" onClick={closeModal}>
                {t("profile.modalCancel")}
              </button>
              {activeModal === "password" ? (
                <button
                  className={styles.modalConfirm}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    void executePasswordChange()
                  }}
                >
                  {isSubmitting
                    ? t("profile.passwordUpdating")
                    : t("profile.passwordSubmit")}
                </button>
              ) : (
                <button
                  className={styles.modalConfirm}
                  type="button"
                  onClick={handleModalConfirm}
                >
                  {t("profile.modalConfirm")}
                </button>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
