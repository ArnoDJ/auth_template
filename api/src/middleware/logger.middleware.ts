import { Injectable, Logger, NestMiddleware } from "@nestjs/common"
import { Request, Response, NextFunction } from "express"

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP")

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req
    const safeUrl = this.sanitizeUrl(originalUrl)
    res.on("finish", () => {
      const { statusCode } = res
      this.logger.log(`${method} ${safeUrl} ${statusCode}`)
    })
    next()
  }

  private sanitizeUrl(url: string): string {
    return url
      .replace(/(\/auth\/password-reset\/)([^/?#]+)/i, "$1[REDACTED]")
      .replace(/([?&]token=)([^&]+)/i, "$1[REDACTED]")
  }
}
