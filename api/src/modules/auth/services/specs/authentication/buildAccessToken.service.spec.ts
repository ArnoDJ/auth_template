import { buildUserDto } from "../../../../../factories/userDto.factory"
import { BaseTest } from "../../../../../helpers/base-test"
import { BuildAccessTokenService } from "../../authentication/buildAccessToken.service"
import { JwtService } from "@nestjs/jwt"

class TestContext extends BaseTest {}

describe("BuildAccessTokenService", () => {
  const ctx = new TestContext()

  let service: BuildAccessTokenService
  let jwtMock: jest.Mocked<JwtService>

  beforeAll(async () => {
    await ctx.init()
  })

  beforeEach(async () => {
    await ctx.startTransaction()

    jwtMock = {
      signAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>

    service = ctx.createService(
      BuildAccessTokenService,
      [],
      new Map([
        [JwtService, jwtMock],
      ])
    )
  })

  it("builds token with correct payload", async () => {
    jwtMock.signAsync.mockResolvedValue("signed-token")

    const userDto = buildUserDto()

    const result = await service.execute(userDto)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(jwtMock.signAsync).toHaveBeenCalledWith({
      sub: userDto.id,
      admin: userDto.admin,
    })

    expect(result).toBe("signed-token")
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
