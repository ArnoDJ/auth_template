import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable
} from "@nestjs/common"
import { Request } from "express"

type Bucket = {
  count: number
  resetAt: number
}

abstract class InMemoryRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>()

  protected abstract readonly limit: number
  protected abstract readonly windowMs: number
  protected abstract getBucketKey(request: Request): string

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const key = this.getBucketKey(request)

    this.cleanupExpiredBuckets()

    const now = Date.now()
    const current = this.buckets.get(key)

    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs })
      return true
    }

    if (current.count >= this.limit) {
      throw new HttpException("too many requests", HttpStatus.TOO_MANY_REQUESTS)
    }

    current.count += 1
    this.buckets.set(key, current)
    return true
  }

  protected getClientIp(request: Request): string {
    const forwardedFor = request.headers["x-forwarded-for"]
    if (typeof forwardedFor === "string") {
      return forwardedFor.split(",")[0].trim()
    }

    return request.ip || "unknown"
  }

  private cleanupExpiredBuckets(): void {
    const now = Date.now()
    for (const [key, value] of this.buckets.entries()) {
      if (value.resetAt <= now) {
        this.buckets.delete(key)
      }
    }
  }
}

@Injectable()
export class LoginRateLimitGuard extends InMemoryRateLimitGuard {
  protected readonly limit = 8
  protected readonly windowMs = 60_000

  protected getBucketKey(request: Request): string {
    const ip = this.getClientIp(request)
    const email =
      typeof (request.body as { email?: unknown })?.email === "string"
        ? (request.body as { email: string }).email.toLowerCase().trim()
        : "unknown"
    return `login:${ip}:${email}`
  }
}

@Injectable()
export class RefreshTokenRateLimitGuard extends InMemoryRateLimitGuard {
  protected readonly limit = 20
  protected readonly windowMs = 60_000

  protected getBucketKey(request: Request): string {
    const ip = this.getClientIp(request)
    return `refresh:${ip}`
  }
}

@Injectable()
export class PasswordResetRequestRateLimitGuard extends InMemoryRateLimitGuard {
  protected readonly limit = 5
  protected readonly windowMs = 10 * 60_000

  protected getBucketKey(request: Request): string {
    const ip = this.getClientIp(request)
    const email =
      typeof (request.body as { email?: unknown })?.email === "string"
        ? (request.body as { email: string }).email.toLowerCase().trim()
        : "unknown"
    return `password-reset:${ip}:${email}`
  }
}
