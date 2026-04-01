import { randomUUID } from "crypto"
import { Repository } from "typeorm"
import { BaseTest } from "../../../../../helpers/base-test"
import { userMock } from "../../../../../mocks/user.mock"
import { User } from "../../../entities/user"
import { RefreshToken } from "../../../entities/refreshToken"
import { RevokeAllRefreshTokensForUserService } from "../../refresh-token/revokeAllRefreshTokensForUser.service"

class TestContext extends BaseTest {}

describe("RevokeAllRefreshTokensForUserService", () => {
  const ctx = new TestContext()
  let service: RevokeAllRefreshTokensForUserService
  let repos: {
    user: Repository<User>
    refreshToken: Repository<RefreshToken>
  }

  beforeAll(async () => {
    await ctx.init()
  })

  beforeEach(async () => {
    await ctx.startTransaction()
    repos = ctx.setupRepos({
      user: User,
      refreshToken: RefreshToken,
    })
    service = ctx.createService(RevokeAllRefreshTokensForUserService, [
      repos.refreshToken,
    ])
  })

  it("revokes all active refresh tokens for a user", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`,
    })
    const otherUser = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`,
    })

    const activeTokenOne = await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-1",
      revoked: false,
      tokenVersion: 1,
    })
    const activeTokenTwo = await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-2",
      revoked: false,
      tokenVersion: 2,
    })
    const alreadyRevokedToken = await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-3",
      revoked: true,
      tokenVersion: 3,
    })
    const otherUserToken = await repos.refreshToken.save({
      userId: otherUser.id,
      userAgent: "agent-4",
      revoked: false,
      tokenVersion: 1,
    })

    await service.execute(user.id)

    const updatedActiveTokenOne = await repos.refreshToken.findOneByOrFail({
      id: activeTokenOne.id,
    })
    const updatedActiveTokenTwo = await repos.refreshToken.findOneByOrFail({
      id: activeTokenTwo.id,
    })
    const unchangedRevokedToken = await repos.refreshToken.findOneByOrFail({
      id: alreadyRevokedToken.id,
    })
    const unchangedOtherUserToken = await repos.refreshToken.findOneByOrFail({
      id: otherUserToken.id,
    })

    expect(updatedActiveTokenOne.revoked).toBe(true)
    expect(updatedActiveTokenTwo.revoked).toBe(true)
    expect(unchangedRevokedToken.revoked).toBe(true)
    expect(unchangedOtherUserToken.revoked).toBe(false)
  })

  it("does nothing when user has no active refresh tokens", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`,
    })

    await service.execute(user.id)

    const tokens = await repos.refreshToken.find({ where: { userId: user.id } })
    expect(tokens).toHaveLength(0)
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
