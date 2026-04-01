import { hash } from "bcrypt"
import { randomUUID } from "crypto"
import request from "supertest"
import { QueryRunner, Repository } from "typeorm"
import {
  closeE2eAppContext,
  createE2eAppContext,
  E2eAppContext,
  getAccessTokenFromBody,
  getCookiePair,
  getCookieValue,
  getHttpServer,
  getSetCookieHeader,
  resetAuthTables
} from "../../../../helpers/e2e-test-app"
import { userMock } from "../../../../mocks/user.mock"
import { RefreshToken } from "../../entities/refreshToken"
import { User } from "../../entities/user"

describe("RefreshTokenController (E2E)", () => {
  const userAgent = "bk-connect-refresh-e2e-agent"
  const dbLockKey = 42_4242

  let context: E2eAppContext
  let dbLock: QueryRunner
  let userRepository: Repository<User>
  let refreshTokenRepository: Repository<RefreshToken>
  const acquireDbLock = async (): Promise<QueryRunner> => {
    const queryRunner = context.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.query("SELECT pg_advisory_lock($1)", [dbLockKey])
    return queryRunner
  }

  const releaseDbLock = async (queryRunner: QueryRunner): Promise<void> => {
    try {
      await queryRunner.query("SELECT pg_advisory_unlock($1)", [dbLockKey])
    } finally {
      await queryRunner.release()
    }
  }

  const createUser = async (password = "Password123!"): Promise<User> => {
    return await userRepository.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`,
      password: await hash(password, 10),
      admin: false
    })
  }

  beforeAll(async () => {
    context = await createE2eAppContext()
    dbLock = await acquireDbLock()
    userRepository = context.dataSource.getRepository(User)
    refreshTokenRepository = context.dataSource.getRepository(RefreshToken)
  })

  beforeEach(async () => {
    await resetAuthTables(context.dataSource)
  })

  it("refreshes tokens when refresh cookie and csrf token are valid", async () => {
    const user = await createUser()
    const loginResponse = await request(getHttpServer(context.app))
      .post("/auth/token")
      .set("user-agent", userAgent)
      .send({
        email: user.email,
        password: "Password123!"
      })
      .expect(200)

    const refreshTokenCookie = getCookiePair(
      loginResponse.headers["set-cookie"],
      "refreshToken"
    )
    const csrfCookie = getCookiePair(loginResponse.headers["set-cookie"], "_csrf")
    const csrfToken = getCookieValue(loginResponse.headers["set-cookie"], "_csrf")
    if (!refreshTokenCookie || !csrfCookie || !csrfToken) {
      throw new Error("expected auth cookies from login response")
    }

    const response = await request(getHttpServer(context.app))
      .post("/auth/refresh_token")
      .set("user-agent", userAgent)
      .set("x-csrf-token", csrfToken)
      .set("Cookie", [refreshTokenCookie, csrfCookie])
      .expect(200)

    expect(getAccessTokenFromBody(response.body)).toEqual(expect.any(String))
    expect(
      getSetCookieHeader(response.headers["set-cookie"], "refreshToken")
    ).toBeDefined()
    expect(getSetCookieHeader(response.headers["set-cookie"], "_csrf")).toBeDefined()

    const savedState = await refreshTokenRepository.findOneByOrFail({
      userId: user.id,
      userAgent
    })
    expect(savedState.tokenVersion).toBe(1)
    expect(savedState.revoked).toBe(false)
  })

  it("returns unauthorized when refresh token cookie is missing", async () => {
    const user = await createUser()
    const loginResponse = await request(getHttpServer(context.app))
      .post("/auth/token")
      .set("user-agent", userAgent)
      .send({
        email: user.email,
        password: "Password123!"
      })
      .expect(200)

    const csrfCookie = getCookiePair(loginResponse.headers["set-cookie"], "_csrf")
    const csrfToken = getCookieValue(loginResponse.headers["set-cookie"], "_csrf")
    if (!csrfCookie || !csrfToken) {
      throw new Error("expected csrf cookie from login response")
    }

    await request(getHttpServer(context.app))
      .post("/auth/refresh_token")
      .set("user-agent", userAgent)
      .set("x-csrf-token", csrfToken)
      .set("Cookie", [csrfCookie])
      .expect(401)
  })

  it("returns unauthorized when csrf header does not match csrf cookie", async () => {
    const user = await createUser()
    const loginResponse = await request(getHttpServer(context.app))
      .post("/auth/token")
      .set("user-agent", userAgent)
      .send({
        email: user.email,
        password: "Password123!"
      })
      .expect(200)

    const refreshTokenCookie = getCookiePair(
      loginResponse.headers["set-cookie"],
      "refreshToken"
    )
    const csrfCookie = getCookiePair(loginResponse.headers["set-cookie"], "_csrf")
    if (!refreshTokenCookie || !csrfCookie) {
      throw new Error("expected auth cookies from login response")
    }

    await request(getHttpServer(context.app))
      .post("/auth/refresh_token")
      .set("user-agent", userAgent)
      .set("x-csrf-token", "invalid-token")
      .set("Cookie", [refreshTokenCookie, csrfCookie])
      .expect(401)
  })

  afterAll(async () => {
    await resetAuthTables(context.dataSource)
    await releaseDbLock(dbLock)
    await closeE2eAppContext(context)
  })
})
