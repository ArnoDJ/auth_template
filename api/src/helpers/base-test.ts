import { INestApplication, Type } from "@nestjs/common"
import { TestingModule } from "@nestjs/testing"
import {
  DataSource,
  QueryRunner,
  Repository,
  ObjectLiteral,
  EntityManager,
} from "typeorm"
import { createTestContext } from "./testHelper"

type EntityClass<Entity> = new (...args: any[]) => Entity
type OverrideMap = Map<Type<unknown>, unknown>

export abstract class BaseTest {
  protected app!: INestApplication
  protected moduleRef!: TestingModule
  protected dataSource!: DataSource

  private queryRunner!: QueryRunner
  private transactionStarted = false

  protected repos!: Record<string, Repository<any>>

  async init(): Promise<void> {
    const ctx = await createTestContext()

    this.app = ctx.app
    this.moduleRef = ctx.module
    this.dataSource = ctx.dataSource
  }

  async startTransaction(): Promise<void> {
    this.queryRunner = this.dataSource.createQueryRunner()
    await this.queryRunner.connect()
    await this.queryRunner.startTransaction()

    this.transactionStarted = true
    this.repos = {}
  }

  async rollback(): Promise<void> {
    if (!this.queryRunner.isReleased) {
      if (this.queryRunner.isTransactionActive) {
        await this.queryRunner.rollbackTransaction()
      }
      await this.queryRunner.release()
    }

    this.transactionStarted = false
  }

  async close(): Promise<void> {
    await this.app.close()
  }

  public getService<T>(type: new (...args: any[]) => T): T {
    return this.moduleRef.get(type)
  }

  private getRepoInternal<Entity extends ObjectLiteral>(
    entity: EntityClass<Entity>
  ): Repository<Entity> {
    if (!this.transactionStarted) {
      throw new Error(
        `❌ getRepo(${entity.name}) called before transaction started.\n` +
          "👉 Call it after startTransaction()"
      )
    }

    return this.queryRunner.manager.getRepository(entity)
  }

  public setupRepos<T extends Record<string, EntityClass<any>>>(
    entities: T
  ): { [K in keyof T]: Repository<InstanceType<T[K]>> } {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const result = {} as { [K in keyof T]: Repository<InstanceType<T[K]>> }
    for (const key of Object.keys(entities) as Array<keyof T>) {
      const entity = entities[key]
      result[key] = this.getRepoInternal(entity)
    }

    this.repos = result

    return result
  }

  public getRepo<Entity extends ObjectLiteral>(
    entity: EntityClass<Entity>
  ): Repository<Entity> {
    return this.getRepoInternal(entity)
  }

  protected getManager(): EntityManager {
    if (!this.transactionStarted) {
      throw new Error("❌ getManager() called before transaction started")
    }

    return this.queryRunner.manager
  }

  public createService<T>(
    serviceClass: Type<T>,
    repos: Array<Repository<ObjectLiteral> | undefined> = [],
    overrides: OverrideMap = new Map()
  ): T {
    if (!this.transactionStarted) {
      throw new Error(
        `❌ createService(${serviceClass.name}) called before transaction started`
      )
    }

    const paramTypes = Reflect.getMetadata(
      "design:paramtypes",
      serviceClass
    ) as unknown[]

    let repoIndex = 0

    const params: unknown[] = paramTypes.map((paramType) => {
      if (overrides.has(paramType as Type<unknown>)) {
        return overrides.get(paramType as Type<unknown>)
      }

      if (paramType === Repository) {
        const repo = repos[repoIndex++]
        if (!repo) {
          throw new Error(
            `❌ Missing repository for ${serviceClass.name} constructor`
          )
        }
        return repo
      }
      return this.moduleRef.get(paramType as Type<unknown>, { strict: false })
    })

    return new serviceClass(...(params as unknown as []))
  }
}
