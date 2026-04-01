import { randomUUID } from "crypto"
import { BaseTest } from "../../../../../helpers/base-test"
import { User } from "../../../entities/user"
import { RefreshToken } from "../../../entities/refreshToken"
import { Repository } from "typeorm"
import { userMock } from "../../../../../mocks/user.mock"
import { FindOrCreateRefreshTokenStateService } from "../../refresh-token/findOrCreateRefreshTokenState.service"
import { GetUserByIdService } from "../../../../users/services/users/getUserById.service"

class TestContext extends BaseTest {}

describe("FindOrCreateRefreshTokenStateService", () => {
  const ctx = new TestContext()
  let service: FindOrCreateRefreshTokenStateService
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
    const getUserByIdService = new GetUserByIdService(repos.user)
    service = new FindOrCreateRefreshTokenStateService(
      getUserByIdService,
      repos.refreshToken
    )
  })

  it("creates a token state when none exists", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`
    })
    await service.execute(user.id, "agent-1")
    const createdState = await repos.refreshToken.findOneOrFail({
      where: { userId: user.id, userAgent: "agent-1" }
    })

    expect(createdState.userId).toBe(user.id)
    expect(createdState.userAgent).toBe("agent-1")
    expect(createdState.revoked).toBe(false)
    expect(createdState.tokenVersion).toBe(0)
  })

  it("increments version, unrevokes and returns updated state when one exists", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`
    })
    const existingState = await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-1",
      revoked: true,
      tokenVersion: 5
    })
    await service.execute(user.id, "agent-1")
    const updatedState = await repos.refreshToken.findOneOrFail({
      where: { id: existingState.id }
    })

    expect(updatedState.id).toBe(existingState.id)
    expect(updatedState.revoked).toBe(false)
    expect(updatedState.tokenVersion).toBe(6)
  })

  it("creates a fresh state when post-update lookup returns null", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`
    })
    const existingState = await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-1",
      revoked: true,
      tokenVersion: 1
    })
    const originalUpdate = repos.refreshToken.update.bind(repos.refreshToken)
    jest
      .spyOn(repos.refreshToken, "update")
      .mockImplementation(async (criteria, partialEntity) => {
        const result = await originalUpdate(criteria, partialEntity)
        await repos.refreshToken.delete({ id: existingState.id })
        return result
      })

    await service.execute(user.id, "agent-1")

    const allStates = await repos.refreshToken.find({
      where: { userId: user.id, userAgent: "agent-1" },
      order: { createdAt: "ASC" }
    })

    expect(allStates).toHaveLength(1)
    expect(allStates[0]?.id).not.toBe(existingState.id)
    expect(allStates[0]?.userId).toBe(user.id)
    expect(allStates[0]?.userAgent).toBe("agent-1")
    expect(allStates[0]?.revoked).toBe(false)
    expect(allStates[0]?.tokenVersion).toBe(0)
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
