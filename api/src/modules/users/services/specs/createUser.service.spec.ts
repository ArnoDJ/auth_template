import { BadRequestException, ConflictException } from "@nestjs/common"
import { compare } from "bcrypt"
import { BaseTest } from "../../../../helpers/base-test"
import { userMock } from "../../../../mocks/user.mock"
import { User } from "../../../auth/entities/user"
import { CreateUserService } from "../users/createUser.service"
import { Repository } from "typeorm"

class TestContext extends BaseTest {}

describe("CreateUserService", () => {
  const ctx = new TestContext()

  let service: CreateUserService
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
    service = new CreateUserService(repos.user)
  })

  it("creates an inactive user with a hashed password and default flags", async () => {
    const result = await service.execute({
      firstName: "Tony",
      lastName: "Stark",
      email: "tony.stark@test.com",
      password: "Password123!",
      passwordConfirmation: "Password123!"
    })

    const savedUser = await repos.user.findOneByOrFail({
      id: result.id
    })

    expect(result.email).toBe("tony.stark@test.com")
    expect(savedUser.firstName).toBe("Tony")
    expect(savedUser.lastName).toBe("Stark")
    expect(savedUser.admin).toBe(false)
    expect(savedUser.isActive).toBe(false)
    expect(savedUser.password).not.toBe("Password123!")
    expect(await compare("Password123!", savedUser.password)).toBe(true)
  })

  it("throws when password confirmation does not match", async () => {
    await expect(
      service.execute({
        firstName: "Tony",
        lastName: "Stark",
        email: "tony.stark@test.com",
        password: "Password123!",
        passwordConfirmation: "Password1234!"
      })
    ).rejects.toThrow(BadRequestException)
  })

  it("throws when email already exists", async () => {
    await repos.user.save({
      ...userMock,
      id: crypto.randomUUID(),
      email: "tony.stark@test.com",
      password: "hashed-password",
      admin: false
    })

    await expect(
      service.execute({
        firstName: "Tony",
        lastName: "Stark",
        email: "tony.stark@test.com",
        password: "Password123!",
        passwordConfirmation: "Password123!"
      })
    ).rejects.toThrow(ConflictException)
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
