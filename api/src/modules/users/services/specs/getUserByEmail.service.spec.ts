import { BaseTest } from "../../../../helpers/base-test"
import { GetUserByEmailService } from "../users/getUserByEmail.service"
import { User } from "../../../../modules/auth/entities/user"
import { NotFoundException } from "@nestjs/common"
import { userMock } from "../../../../mocks/user.mock"
import { Repository } from "typeorm"

class TestContext extends BaseTest {}

describe("GetUserByEmailService", () => {
  const ctx = new TestContext()
  let getUserByEmailService: GetUserByEmailService
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
    getUserByEmailService = ctx.createService(
      GetUserByEmailService,
      [repos.user]
    )
  })

  it("successfully returns user when email exists", async () => {
    const email = "test@test.com"

    await repos.user.save({
      ...userMock,
      email,
    })

    const result = await getUserByEmailService.execute(email)

    expect(result).toBeDefined()
    expect(result.email).toBe(email)
  })

  it("fails to return user when email does not exist", async () => {
    const email = "doesnotexist@test.com"

    await expect(
      getUserByEmailService.execute(email)
    ).rejects.toThrow(NotFoundException)
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
