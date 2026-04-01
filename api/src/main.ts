import { NestFactory } from "@nestjs/core"
import { AppModule } from "./modules/app/app.module"
import { initializeTransactionalContext } from "typeorm-transactional"
import cookieParser from "cookie-parser"
import { NestExpressApplication } from "@nestjs/platform-express"
import { SwaggerModule } from "@nestjs/swagger"
import { join } from "path"

initializeTransactionalContext()
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const allowedOrigins = AppModule.allowedOrigins

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true)
        return
      }

      const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i
      if (localOriginPattern.test(origin)) {
        callback(null, true)
        return
      }

      if (process.env.NODE_ENV !== "production") {
        callback(null, true)
        return
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`), false)
    },
    credentials: true,
    methods: ["*"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Build-Number",
      "X-CSRF-Token",
      "X-XSRF-TOKEN",
      "Cache-Control",
      "Pragma",
    ],
  })
  app.use(cookieParser())
  app.useStaticAssets(join(__dirname, "..", "public"))
  app.enableShutdownHooks()

  const document = SwaggerModule.createDocument(app, {
    openapi: "3.0.0",
    info: {
      title: AppModule.apiTitle,
      description: AppModule.apiDescription,
      version: AppModule.apiVersion,
    },
    components: {
      securitySchemes: {
        bearer: {
          type: "http" as const,
          scheme: "bearer" as const,
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearer: [] as string[] }],
  })
  SwaggerModule.setup("api", app, document)
  await app.listen(process.env.PORT ?? 4000)
}
void bootstrap()
