import { RefreshToken } from "../modules/auth/entities/refreshToken"

export const buildRefreshToken = (
  overrides: Partial<RefreshToken> = {}
): RefreshToken => {
  const refreshToken = new RefreshToken()
  refreshToken.id = "refresh-token-id"
  refreshToken.userId = "user-id"
  refreshToken.userAgent = "agent-1"
  refreshToken.revoked = false
  refreshToken.tokenVersion = 0
  refreshToken.createdAt = new Date()
  refreshToken.updatedAt = new Date()
  return Object.assign(refreshToken, overrides)
}
