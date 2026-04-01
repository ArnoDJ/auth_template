"use client"

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useSyncExternalStore
} from "react"

const authStorageKey = "auth-template.auth"
const authChangeEvent = "auth-template-auth-change"

type AuthState = {
  accessToken: string | null
  isHydrated: boolean
}

type AuthContextValue = AuthState & {
  isAuthenticated: boolean
  setAccessToken: (accessToken: string) => void
  clearAccessToken: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const readStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null
  }

  const storedValue = window.localStorage.getItem(authStorageKey)
  return storedValue && storedValue.length > 0 ? storedValue : null
}

const subscribeToAuthState = (onStoreChange: () => void): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const handleStorage = (event: StorageEvent): void => {
    if (event.key === null || event.key === authStorageKey) {
      onStoreChange()
    }
  }

  const handleAuthChange = (): void => {
    onStoreChange()
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(authChangeEvent, handleAuthChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(authChangeEvent, handleAuthChange)
  }
}

const getClientHydratedState = (): boolean => true
const getServerHydratedState = (): boolean => false

export const AuthProvider = ({
  children
}: Readonly<{
  children: ReactNode
}>) => {
  const accessToken = useSyncExternalStore(
    subscribeToAuthState,
    readStoredAccessToken,
    () => null
  )
  const isHydrated = useSyncExternalStore(
    () => () => undefined,
    getClientHydratedState,
    getServerHydratedState
  )

  const value = useMemo<AuthContextValue>(() => {
    const setAccessToken = (accessToken: string): void => {
      window.localStorage.setItem(authStorageKey, accessToken)
      window.dispatchEvent(new Event(authChangeEvent))
    }

    const clearAccessToken = (): void => {
      window.localStorage.removeItem(authStorageKey)
      window.dispatchEvent(new Event(authChangeEvent))
    }

    return {
      accessToken,
      isHydrated,
      isAuthenticated: Boolean(accessToken),
      setAccessToken,
      clearAccessToken
    }
  }, [accessToken, isHydrated])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}
