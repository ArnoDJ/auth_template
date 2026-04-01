import { BaseTest } from "../../../../helpers/base-test"
import { GetUserByIdService } from "../users/getUserById.service"
import { User } from "../../../../modules/auth/entities/user"
import { NotFoundException } from "@nestjs/common"
import { userMock } from "../../../../mocks/user.mock"
import { Repository } from "typeorm"

class TestContext extends BaseTest {}

describe("GetUserByIdService", () => {
  const ctx = new TestContext()
  let getUserByIdService: GetUserByIdService
  let repos: {
    user: Repository<User>
  }

  beforeAll(async () => {
    await ctx.init()
  })

  beforeEach(async () => {
    await ctx.startTransaction()
    repos = ctx.setupRepos({
      user: User,
    })
    getUserByIdService = ctx.createService(
      GetUserByIdService,
      [repos.user]
    )
  })

  it("successfully returns user when id exists", async () => {
    const savedUser = await repos.user.save({
      ...userMock,
      firstName: "Tony",
      lastName: "Stark",
      admin: false,
      isActive: true,
    })

    const result = await getUserByIdService.execute(savedUser.id)

    expect(result).toBeDefined()
    expect(result.id).toBe(savedUser.id)
    expect(result.email).toBe(savedUser.email)
  })

  it("fails to return user when id does not exist", async () => {
    const id = "123e4567-e89b-12d3-a456-426614174999"

    await expect(
      getUserByIdService.execute(id)
    ).rejects.toThrow(NotFoundException)
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
