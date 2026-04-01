import { randomUUID } from "crypto"
import { UnauthorizedException } from "@nestjs/common"
import { Repository } from "typeorm"
import { BaseTest } from "../../../../../helpers/base-test"
import { userMock } from "../../../../../mocks/user.mock"
import { User } from "../../../entities/user"
import { RefreshToken } from "../../../entities/refreshToken"
import { GetRefreshTokenStateByUserAndAgentService } from "../../refresh-token/getRefreshTokenByUserAndAgent.service"

class TestContext extends BaseTest {}

describe("GetRefreshTokenStateByUserAndAgentService", () => {
  const ctx = new TestContext()
  let service: GetRefreshTokenStateByUserAndAgentService
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
      refreshToken: RefreshToken
    })
    service = new GetRefreshTokenStateByUserAndAgentService(repos.refreshToken)
  })

  it("returns refresh token state when matching non-revoked state exists", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`
    })
    const refreshTokenState = await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-1",
      revoked: false,
      tokenVersion: 2
    })
    await expect(service.execute(user.id, "agent-1")).resolves.toMatchObject({
      id: refreshTokenState.id,
      userId: user.id,
      userAgent: "agent-1",
      revoked: false,
      tokenVersion: 2
    })
  })

  it("throws when no refresh token state exists for user and agent", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`
    })
    await expect(service.execute(user.id, "agent-1")).rejects.toThrow(
      UnauthorizedException
    )
  })

  it("throws when only revoked refresh token state exists", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`
    })
    await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-1",
      revoked: true,
      tokenVersion: 1
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
