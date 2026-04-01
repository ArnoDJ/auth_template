import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm"
import { DatabaseEnvironmentVariables } from "../../types/databaseEnvironmentVariables"

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(
    private readonly configService: ConfigService<DatabaseEnvironmentVariables, true>
  ) {}

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    const options: TypeOrmModuleOptions = {
      type: "postgres",
      host: this.configService.getOrThrow("POSTGRES_HOST"),
      port: this.configService.getOrThrow("POSTGRES_PORT"),
      database: this.configService.getOrThrow("POSTGRES_DATABASE"),
      username: this.configService.getOrThrow("POSTGRES_USERNAME"),
      password: this.configService.getOrThrow("POSTGRES_PASSWORD"),
      autoLoadEntities: true,
      migrations: [this.migrationsDir],
      synchronize: this.shouldSynchronize,
      logging: this.isLogging(),
    }

    return options
  }

  private get isDev(): boolean {
    return this.configService.getOrThrow("NODE_ENV") === "development"
  }

  private get isProd(): boolean {
    return this.configService.getOrThrow("NODE_ENV") === "production"
  }

  private get shouldSynchronize(): boolean {
    return !this.isProd
  }

  private get migrationsDir(): string {
    return this.isDev
      ? `${__dirname}/migrations/**/*.ts`
      : `${__dirname}/migrations/**/*.js`
  }

  private isLogging(): boolean {
    if (this.isProd) {
      return false
    } else if (this.willLogSql) {
      return true
    } else {
      return false
    }
  }

  public get willLogSql(): boolean {
    return this.configService.get("LOG_SQL", false)
  }
}
