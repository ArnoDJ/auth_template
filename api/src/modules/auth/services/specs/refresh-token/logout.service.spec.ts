import { randomUUID } from "crypto"
import { UnauthorizedException } from "@nestjs/common"
import { Repository } from "typeorm"
import { BaseTest } from "../../../../../helpers/base-test"
import { userMock } from "../../../../../mocks/user.mock"
import { User } from "../../../entities/user"
import { RefreshToken } from "../../../entities/refreshToken"
import { LogoutService } from "../../refresh-token/logout.service"
import { GetRefreshTokenStateByUserAndAgentService } from "../../refresh-token/getRefreshTokenByUserAndAgent.service"

class TestContext extends BaseTest {}

describe("LogoutService", () => {
  const ctx = new TestContext()
  let service: LogoutService
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
    const getRefreshTokenStateByUserAndAgentService = ctx.createService(
      GetRefreshTokenStateByUserAndAgentService,
      [repos.refreshToken]
    )

    service = ctx.createService(
      LogoutService,
      [repos.refreshToken],
      new Map([
        [
          GetRefreshTokenStateByUserAndAgentService,
          getRefreshTokenStateByUserAndAgentService,
        ],
      ])
    )
  })

  it("revokes the refresh token state for current user agent", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`,
    })
    const refreshTokenState = await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-1",
      revoked: false,
      tokenVersion: 2,
    })
    await service.execute(user.id, "agent-1")

    const updatedState = await repos.refreshToken.findOneByOrFail({
      id: refreshTokenState.id,
    })
    expect(updatedState.revoked).toBe(true)
    expect(updatedState.tokenVersion).toBe(2)
    expect(updatedState.updatedAt.getTime()).toBeGreaterThanOrEqual(
      refreshTokenState.updatedAt.getTime()
    )
  })

  it("throws when token state for user agent is missing", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`,
    })
    await expect(service.execute(user.id, "agent-1")).rejects.toThrow(
      UnauthorizedException
    )
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
