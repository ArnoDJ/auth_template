import { INestApplication } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import cookieParser from "cookie-parser"
import request from "supertest"
import { DataSource, QueryRunner } from "typeorm"
import { initializeTransactionalContext } from "typeorm-transactional"
import { AppModule } from "../modules/app/app.module"

initializeTransactionalContext()

export type E2eAppContext = {
  app: INestApplication
  dataSource: DataSource
  moduleRef: TestingModule
}

export type E2eDbLock = QueryRunner
export const createE2eAppContext = async (): Promise<E2eAppContext> => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(cookieParser())
  await app.init()

  return {
    app,
    dataSource: moduleRef.get(DataSource),
    moduleRef
  }
}

export const getHttpServer = (
  app: INestApplication
): Parameters<typeof request>[0] => {
  return app.getHttpServer() as unknown as Parameters<typeof request>[0]
}

export const resetAuthTables = async (dataSource: DataSource): Promise<void> => {
  await dataSource.query('DELETE FROM "email_verification_tokens"')
  await dataSource.query('DELETE FROM "password_reset_tokens"')
  await dataSource.query('DELETE FROM "refresh_tokens"')
  await dataSource.query('DELETE FROM "users"')
}

export const closeE2eAppContext = async (
  context: E2eAppContext
): Promise<void> => {
  await context.app.close()
}

export const acquireE2eDbLock = async (
  dataSource: DataSource,
  key = 42_4242
): Promise<E2eDbLock> => {
  const queryRunner = dataSource.createQueryRunner()
  await queryRunner.connect()
  await queryRunner.query("SELECT pg_advisory_lock($1)", [key])
  return queryRunner
}

export const releaseE2eDbLock = async (
  queryRunner: E2eDbLock
): Promise<void> => {
  try {
    await queryRunner.query("SELECT pg_advisory_unlock($1)", [42_4242])
  } finally {
    await queryRunner.release()
  }
}

export const getSetCookieHeader = (
  setCookieHeaders: unknown,
  name: string
): string | undefined => {
  if (!Array.isArray(setCookieHeaders)) {
    return undefined
  }

  for (const cookie of setCookieHeaders) {
    if (typeof cookie === "string" && cookie.startsWith(`${name}=`)) {
      return cookie
    }
  }

  return undefined
}

export const getCookiePair = (
  setCookieHeaders: unknown,
  name: string
): string | undefined => {
  const cookieHeader = getSetCookieHeader(setCookieHeaders, name)
  return cookieHeader?.split(";")[0]
}

export const getCookieValue = (
  setCookieHeaders: unknown,
  name: string
): string | undefined => {
  const cookiePair = getCookiePair(setCookieHeaders, name)
  return cookiePair?.slice(name.length + 1)
}

export const getAccessTokenFromBody = (body: unknown): string => {
  if (typeof body !== "object" || body === null) {
    throw new Error("expected object response body")
  }

  const responseBody = body as { accessToken?: unknown }
  if (typeof responseBody.accessToken !== "string") {
    throw new Error("expected accessToken in response body")
  }

  return responseBody.accessToken
}

export const waitForCondition = async (
  condition: () => Promise<boolean> | boolean,
  timeoutMs = 1_000,
  intervalMs = 10
): Promise<void> => {
  const timeoutAt = Date.now() + timeoutMs
  while (Date.now() < timeoutAt) {
    if (await condition()) {
      return
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, intervalMs)
    })
  }

  throw new Error("timed out waiting for condition")
}
