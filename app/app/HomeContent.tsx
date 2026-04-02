"use client"

import { HomeDashboardState } from "./home/HomeDashboardState"
import { HomeGuestState } from "./home/HomeGuestState"
import { HomeLoadingState } from "./home/HomeLoadingState"
import { useAuth } from "./providers/AuthProvider"
import { useI18n } from "./providers/I18nProvider"

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export const HomeContent = () => {
  const { t } = useI18n()
  const { accessToken, clearAccessToken, isAuthenticated, isHydrated } =
    useAuth()

  if (!isHydrated) {
    return <HomeLoadingState t={t} />
  }

  if (!isAuthenticated) {
    return <HomeGuestState apiUrl={apiUrl} t={t} />
  }

  return (
    <HomeDashboardState
      accessToken={accessToken}
      apiUrl={apiUrl}
      onLogout={clearAccessToken}
      t={t}
    />
  )
}
