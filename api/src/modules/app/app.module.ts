import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { ScheduleModule } from "@nestjs/schedule"
import { DatabaseModule } from "../database/database.module"
import { LoggerMiddleware } from "../../middleware/logger.middleware"
import { AuthModule } from "../auth/auth.module"

// eslint-disable-next-line @typescript-eslint/naming-convention
const runningOnAppService = !!process.env.WEBSITE_SITE_NAME

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: runningOnAppService,
      envFilePath: runningOnAppService
        ? []
        : process.env.NODE_ENV
          ? [`.env.${process.env.NODE_ENV}`, ".env"]
          : [".env.development", ".env"],
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  public static port: string | number
  public static apiVersion: string
  public static apiTitle: string
  public static apiDescription: string
  public static allowedOrigins: string[]

  constructor(private readonly configService: ConfigService) {
    AppModule.port = this.configService.get<number>("PORT") ?? 4000
    AppModule.apiVersion = this.configService.get<string>("API_VERSION") ?? "1.0"
    AppModule.apiTitle = this.configService.get<string>("API_TITLE") ?? "Auth Template API"
    AppModule.apiDescription = this.configService.get<string>("API_DESCRIPTION") ?? "Auth Template backend"
    AppModule.allowedOrigins = this.parseAllowedOrigins(
      this.configService.get<string>("ALLOWED_ORIGINS") ?? "*"
    )
  }

  private parseAllowedOrigins(allowedOriginsFromConfig: string): string[] {
    // Treat "*" or empty as "allow all"
    if (!allowedOriginsFromConfig || allowedOriginsFromConfig.trim() === "*") {
      return []
    }
    return allowedOriginsFromConfig
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes("*")
  }
}
