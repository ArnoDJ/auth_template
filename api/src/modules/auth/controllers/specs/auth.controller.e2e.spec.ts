import {
  buildMailerSendModuleMock,
  getMailerSendMocks
} from "../../../../factories/mailerSendMock.factory"
import { hash } from "bcrypt"
import { createHash, randomUUID } from "crypto"
import request from "supertest"
import { QueryRunner, Repository } from "typeorm"
import {
  closeE2eAppContext,
  createE2eAppContext,
  E2eAppContext,
  getAccessTokenFromBody,
  getHttpServer,
  getSetCookieHeader,
  resetAuthTables
} from "../../../../helpers/e2e-test-app"
import { userMock } from "../../../../mocks/user.mock"
import { EmailVerificationToken } from "../../entities/emailVerificationToken"
import { RefreshToken } from "../../entities/refreshToken"
import { User } from "../../entities/user"

jest.mock("mailgun.js", () => buildMailerSendModuleMock())
jest.mock("form-data", () => jest.fn())

describe("AuthController (E2E)", () => {
  const userAgent = "auth-template-e2e-agent"
  const dbLockKey = 42_4242

  let context: E2eAppContext
  let dbLock: QueryRunner
  let userRepository: Repository<User>
  let refreshTokenRepository: Repository<RefreshToken>
  let emailVerificationTokenRepository: Repository<EmailVerificationToken>
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

  const createUser = async (
    password = "Password123!",
    isActive = true
  ): Promise<User> => {
    return await userRepository.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`,
      password: await hash(password, 10),
      admin: false,
      isActive
    })
  }

  beforeAll(async () => {
    context = await createE2eAppContext()
    dbLock = await acquireDbLock()
    userRepository = context.dataSource.getRepository(User)
    refreshTokenRepository = context.dataSource.getRepository(RefreshToken)
    emailVerificationTokenRepository =
      context.dataSource.getRepository(EmailVerificationToken)
  })

  beforeEach(async () => {
    getMailerSendMocks().reset()
    await resetAuthTables(context.dataSource)
  })

  it("creates access token and auth cookies for valid credentials", async () => {
    const user = await createUser()

    const response = await request(getHttpServer(context.app))
      .post("/auth/token")
      .set("user-agent", userAgent)
      .send({
        email: user.email,
        password: "Password123!"
      })
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
    expect(savedState.revoked).toBe(false)
    expect(savedState.tokenVersion).toBe(0)
  })

  it("registers an inactive user and sends a verification email", async () => {
    const email = `register-${randomUUID()}@test.com`

    const response = await request(getHttpServer(context.app))
      .post("/auth/register")
      .set("user-agent", userAgent)
      .send({
        firstName: "Tony",
        lastName: "Stark",
        email,
        password: "Password123!",
        passwordConfirmation: "Password123!"
      })
      .expect(200)

    expect(response.body).toEqual({ message: "verification email sent" })
    expect(response.headers["set-cookie"]).toBeUndefined()

    const savedUser = await userRepository.findOneByOrFail({
      email
    })
    const savedToken = await emailVerificationTokenRepository.findOneByOrFail({
      userId: savedUser.id
    })
    const mailerSendMocks = getMailerSendMocks()

    expect(savedUser.firstName).toBe("Tony")
    expect(savedUser.lastName).toBe("Stark")
    expect(savedUser.admin).toBe(false)
    expect(savedUser.isActive).toBe(false)
    expect(savedToken.token).toHaveLength(64)
    expect(mailerSendMocks.mockSend).toHaveBeenCalledTimes(1)
  })

  it("returns conflict when registering with an existing email", async () => {
    const user = await createUser()

    await request(getHttpServer(context.app))
      .post("/auth/register")
      .set("user-agent", userAgent)
      .send({
        firstName: "Tony",
        lastName: "Stark",
        email: user.email,
        password: "Password123!",
        passwordConfirmation: "Password123!"
      })
      .expect(409)
  })

  it("resends verification email for inactive accounts", async () => {
    const user = await createUser("Password123!", false)

    const response = await request(getHttpServer(context.app))
      .post("/auth/resend-verification-email")
      .send({
        email: user.email
      })
      .expect(200)

    expect(response.body).toEqual({
      message:
        "if an unverified account exists for that email, a verification message was sent"
    })
    expect(getMailerSendMocks().mockSend).toHaveBeenCalledTimes(1)
  })

  it("returns a generic response for unknown emails when resending verification", async () => {
    const response = await request(getHttpServer(context.app))
      .post("/auth/resend-verification-email")
      .send({
        email: `unknown-${randomUUID()}@test.com`
      })
      .expect(200)

    expect(response.body).toEqual({
      message:
        "if an unverified account exists for that email, a verification message was sent"
    })
    expect(getMailerSendMocks().mockSend).not.toHaveBeenCalled()
  })

  it("verifies the email and allows the user to log in", async () => {
    const email = `verify-${randomUUID()}@test.com`

    await request(getHttpServer(context.app))
      .post("/auth/register")
      .set("user-agent", userAgent)
      .send({
        firstName: "Tony",
        lastName: "Stark",
        email,
        password: "Password123!",
        passwordConfirmation: "Password123!"
      })
      .expect(200)

    const savedUser = await userRepository.findOneByOrFail({ email })
    const savedToken = await emailVerificationTokenRepository.findOneByOrFail({
      userId: savedUser.id
    })
    const emailParams = getMailerSendMocks().mockSend.mock.calls[0][0]
    if (typeof emailParams.text !== "string") {
      throw new Error("expected verification email text")
    }

    const verificationUrl = emailParams.text.replace(
      "Verify your email using this link: ",
      ""
    )
    const rawToken = verificationUrl.split("/verify-email/")[1]
    if (!rawToken) {
      throw new Error("expected raw token in verification url")
    }

    expect(savedToken.token).toBe(
      createHash("sha256").update(rawToken).digest("hex")
    )

    await request(getHttpServer(context.app))
      .post(`/auth/verify-email/${rawToken}`)
      .send({})
      .expect(200)

    const verifiedUser = await userRepository.findOneByOrFail({ id: savedUser.id })
    expect(verifiedUser.isActive).toBe(true)

    await request(getHttpServer(context.app))
      .post("/auth/token")
      .set("user-agent", userAgent)
      .send({
        email,
        password: "Password123!"
      })
      .expect(200)
  })

  it("returns unauthorized for invalid credentials", async () => {
    const user = await createUser()

    await request(getHttpServer(context.app))
      .post("/auth/token")
      .set("user-agent", userAgent)
      .send({
        email: user.email,
        password: "wrong-password"
      })
      .expect(401)
  })

  it("logs the user out and revokes the active refresh token state", async () => {
    const user = await createUser()
    const loginResponse = await request(getHttpServer(context.app))
      .post("/auth/token")
      .set("user-agent", userAgent)
      .send({
        email: user.email,
        password: "Password123!"
      })
      .expect(200)

    await request(getHttpServer(context.app))
      .post("/auth/logout")
      .set(
        "authorization",
        `Bearer ${getAccessTokenFromBody(loginResponse.body)}`
      )
      .set("user-agent", userAgent)
      .expect(200)

    const savedState = await refreshTokenRepository.findOneByOrFail({
      userId: user.id,
      userAgent
    })
    expect(savedState.revoked).toBe(true)
  })

  afterAll(async () => {
    await resetAuthTables(context.dataSource)
    await releaseDbLock(dbLock)
    await closeE2eAppContext(context)
  })
})
