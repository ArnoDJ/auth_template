import { INestApplication } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { DataSource, QueryRunner } from "typeorm"
import cookieParser from "cookie-parser"
import { AppModule } from "../modules/app/app.module"
import { initializeTransactionalContext } from "typeorm-transactional"

initializeTransactionalContext()

export type TestContext = {
  app: INestApplication
  module: TestingModule
  dataSource: DataSource
  queryRunner: QueryRunner
}
export const createTestContext = async (): Promise<TestContext> => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(cookieParser())
  await app.init()

  const dataSource = moduleRef.get<DataSource>(DataSource)

  const queryRunner = dataSource.createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction()

  return {
    app,
    module: moduleRef,
    dataSource,
    queryRunner,
  }
}

export const closeTestContext = async (ctx: TestContext): Promise<void> => {
  try {
    if (!ctx.queryRunner.isReleased) {
      if (ctx.queryRunner.isTransactionActive) {
        await ctx.queryRunner.rollbackTransaction()
      }
      await ctx.queryRunner.release()
    }
  } finally {
    await ctx.app.close()
  }
}
