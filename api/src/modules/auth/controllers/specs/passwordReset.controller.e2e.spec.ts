import {
  buildMailerSendModuleMock,
  getMailerSendMocks
} from "../../../../factories/mailerSendMock.factory"
import { compare, hash } from "bcrypt"
import { createHash, randomUUID } from "crypto"
import request from "supertest"
import { QueryRunner, Repository } from "typeorm"
import {
  closeE2eAppContext,
  createE2eAppContext,
  E2eAppContext,
  getHttpServer,
  resetAuthTables,
  waitForCondition
} from "../../../../helpers/e2e-test-app"
import { userMock } from "../../../../mocks/user.mock"
import { PasswordResetToken } from "../../entities/passwordResetToken"
import { RefreshToken } from "../../entities/refreshToken"
import { User } from "../../entities/user"

jest.mock("mailgun.js", () => buildMailerSendModuleMock())
jest.mock("form-data", () => jest.fn())

describe("PasswordResetController (E2E)", () => {
  const dbLockKey = 42_4242

  let context: E2eAppContext
  let dbLock: QueryRunner
  let userRepository: Repository<User>
  let refreshTokenRepository: Repository<RefreshToken>
  let passwordResetTokenRepository: Repository<PasswordResetToken>
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
    passwordResetTokenRepository = context.dataSource.getRepository(
      PasswordResetToken
    )
  })

  beforeEach(async () => {
    getMailerSendMocks().reset()
    await resetAuthTables(context.dataSource)
  })

  it("creates a password reset token and sends an email", async () => {
    const user = await createUser()

    await request(getHttpServer(context.app))
      .post("/auth/password-reset/request")
      .send({ email: user.email })
      .expect(200)

    await waitForCondition(async () => {
      return await passwordResetTokenRepository.count({
        where: { userId: user.id }
      }) === 1
    }, 3_000)

    const savedToken = await passwordResetTokenRepository.findOneByOrFail({
      userId: user.id
    })

    expect(savedToken.token).toHaveLength(64)
    expect(getMailerSendMocks().mockSend).toHaveBeenCalledTimes(1)
  })

  it("changes the password, deletes reset tokens and revokes refresh tokens", async () => {
    const user = await createUser("OldPassword123!")
    const rawToken = "reset-token-value"
    await refreshTokenRepository.save({
      userId: user.id,
      userAgent: "agent-1",
      revoked: false,
      tokenVersion: 0
    })
    await passwordResetTokenRepository.save({
      userId: user.id,
      token: createHash("sha256").update(rawToken).digest("hex"),
      validUntil: new Date(Date.now() + 60_000)
    })

    await request(getHttpServer(context.app))
      .post(`/auth/password-reset/${rawToken}`)
      .send({
        password: "NewPassword123!",
        passwordConfirmation: "NewPassword123!"
      })
      .expect(200)

    const updatedUser = await userRepository.findOneByOrFail({ id: user.id })
    const savedRefreshTokens = await refreshTokenRepository.findBy({
      userId: user.id
    })
    const savedResetTokens = await passwordResetTokenRepository.findBy({
      userId: user.id
    })

    expect(await compare("NewPassword123!", updatedUser.password)).toBe(true)
    expect(savedRefreshTokens).toHaveLength(1)
    expect(savedRefreshTokens[0]?.revoked).toBe(true)
    expect(savedResetTokens).toHaveLength(0)
  })

  it("returns bad request for an expired or missing reset token", async () => {
    await request(getHttpServer(context.app))
      .post("/auth/password-reset/missing-token")
      .send({
        password: "NewPassword123!",
        passwordConfirmation: "NewPassword123!"
      })
      .expect(400)
  })

  afterAll(async () => {
    await resetAuthTables(context.dataSource)
    await releaseDbLock(dbLock)
    await closeE2eAppContext(context)
  })
})
