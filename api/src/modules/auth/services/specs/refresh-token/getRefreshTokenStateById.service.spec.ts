import { randomUUID } from "crypto"
import { UnauthorizedException } from "@nestjs/common"
import { Repository } from "typeorm"
import { BaseTest } from "../../../../../helpers/base-test"
import { userMock } from "../../../../../mocks/user.mock"
import { User } from "../../../entities/user"
import { RefreshToken } from "../../../entities/refreshToken"
import { GetRefreshTokenStateByIdService } from "../../refresh-token/getRefreshTokenStateById.service"

class TestContext extends BaseTest {}

describe("GetRefreshTokenStateByIdService", () => {
  const ctx = new TestContext()
  let service: GetRefreshTokenStateByIdService
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
    service = new GetRefreshTokenStateByIdService(repos.refreshToken)
  })

  it("returns refresh token state by id", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`
    })
    const refreshTokenState = await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-1",
      revoked: false,
      tokenVersion: 4
    })
    await expect(service.execute(refreshTokenState.id)).resolves.toMatchObject({
      id: refreshTokenState.id,
      userId: user.id,
      userAgent: "agent-1",
      revoked: false,
      tokenVersion: 4
    })
  })

  it("returns revoked refresh token state by id", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`
    })
    const revokedState = await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-1",
      revoked: true,
      tokenVersion: 1
    })
    await expect(service.execute(revokedState.id)).resolves.toMatchObject({
      id: revokedState.id,
      revoked: true
    })
  })

  it("throws when refresh token state is missing", async () => {
    await expect(service.execute(randomUUID())).rejects.toThrow(
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
