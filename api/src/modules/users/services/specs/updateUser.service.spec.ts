import { NotFoundException } from "@nestjs/common"
import { BaseTest } from "../../../../helpers/base-test"
import { userMock } from "../../../../mocks/user.mock"
import { User } from "../../../auth/entities/user"
import { Repository } from "typeorm"
import { GetUserByIdService } from "../users/getUserById.service"
import { UpdateUserService } from "../users/updateUser.service"

class TestContext extends BaseTest {}

describe("UpdateUserService", () => {
  const ctx = new TestContext()

  let service: UpdateUserService
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
      user: User
    })
    getUserByIdService = new GetUserByIdService(repos.user)
    service = new UpdateUserService(repos.user, getUserByIdService)
  })

  it("updates only firstName and lastName", async () => {
    const savedUser = await repos.user.save({
      ...userMock,
      id: crypto.randomUUID(),
      firstName: "Tony",
      lastName: "Stark",
      email: "tony.stark@test.com",
      password: "hashed-password",
      admin: false
    })

    const result = await service.execute(savedUser.id, {
      firstName: "Peter",
      lastName: "Parker"
    })

    const updatedUser = await repos.user.findOneByOrFail({ id: savedUser.id })

    expect(result.firstName).toBe("Peter")
    expect(result.lastName).toBe("Parker")
    expect(updatedUser.firstName).toBe("Peter")
    expect(updatedUser.lastName).toBe("Parker")
    expect(updatedUser.email).toBe("tony.stark@test.com")
    expect(updatedUser.password).toBe("hashed-password")
  })

  it("throws when user does not exist", async () => {
    await expect(
      service.execute("123e4567-e89b-12d3-a456-426614174999", {
        firstName: "Peter",
        lastName: "Parker"
      })
    ).rejects.toThrow(NotFoundException)
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
