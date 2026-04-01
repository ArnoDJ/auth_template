import { Injectable, Logger, NotFoundException } from "@nestjs/common"
import { Inject } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { InjectRepository } from "@nestjs/typeorm"
import { createHash, randomBytes } from "crypto"
import { Repository } from "typeorm"
import { PasswordResetToken } from "../../entities/passwordResetToken"
import { User } from "../../entities/user"
import FormData from "form-data"
import Mailgun from "mailgun.js"
import { GetUserByEmailService } from "../../../users/services/users/getUserByEmail.service"
import { passwordResetEmailTemplate } from "../../emailTemplates/passwordReset.template"

@Injectable()
export class PasswordResetService {
  private static readonly TTL_MINUTES = 10
  private static readonly MIN_RESPONSE_TIME_MS = 250
  private readonly logger = new Logger(PasswordResetService.name)

  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    @Inject(GetUserByEmailService)
    private readonly getUserByEmailService: GetUserByEmailService,
    @Inject(ConfigService)
    private readonly configService: ConfigService
  ) {}

  public async execute(email: string): Promise<void> {
    const startedAt = Date.now()
    void this.processPasswordResetRequest(email)
    await this.ensureMinimumResponseTime(startedAt)
  }

  private async getUserByEmail(email: string): Promise<User> {
    return await this.getUserByEmailService.execute(email)
  }

  private async getUserByEmailIfExists(email: string): Promise<User | null> {
    try {
      return await this.getUserByEmail(email)
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null
      }
      throw error
    }
  }

  private async processPasswordResetRequest(email: string): Promise<void> {
    try {
      const user = await this.getUserByEmailIfExists(email)
      if (!user) {
        return
      }

      await this.removeExistingPasswordResetTokens(user.id)
      const token = this.buildToken()
      await this.createPasswordResetToken(user.id, this.hashToken(token))
      const resetUrl = this.buildResetUrl(token)
      await this.sendEmailWithToken(user, resetUrl)
    } catch (error) {
      this.logger.warn("Password reset request processing failed")
      this.logger.debug(String(error))
    }
  }

  private async removeExistingPasswordResetTokens(
    userId: string
  ): Promise<void> {
    await this.passwordResetTokenRepository.delete({ userId })
  }

  private async createPasswordResetToken(
    userId: string,
    token: string
  ): Promise<void> {
    await this.passwordResetTokenRepository.save({
      userId,
      token,
      validUntil: new Date(
        Date.now() + PasswordResetService.TTL_MINUTES * 60_000
      )
    })
  }

  private buildResetUrl(token: string): string {
    const frontendBaseUrl =
      this.configService.get<string>("FRONTEND_BASE_URL") ??
      this.configService.get<string>("APP_URL") ??
      "http://localhost:3000"
    const trimmedBaseUrl = frontendBaseUrl.endsWith("/")
      ? frontendBaseUrl.slice(0, -1)
      : frontendBaseUrl
    return `${trimmedBaseUrl}/password-reset/${token}`
  }

  private buildToken(): string {
    return randomBytes(32).toString("hex")
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex")
  }

  private async sendEmailWithToken(
    user: User,
    resetUrl: string
  ): Promise<void> {
    const mailgun = new Mailgun(FormData)
    const client = mailgun.client({
      username: "api",
      key: this.configService.get<string>("MAILGUN_API_KEY") ?? "",
      url: this.configService.get<string>("MAILGUN_API_URL")
    })
    const domain = this.getDomain()

    const { subject, html } = passwordResetEmailTemplate(user, resetUrl)

    await client.messages.create(domain, {
      from: this.buildFrom(),
      to: [`${user.firstName} ${user.lastName} <${user.email}>`],
      subject,
      html,
      text: `Reset your password using this link: ${resetUrl}`
    })
  }

  private buildFrom(): string {
    const email = this.configService.get<string>("MAILGUN_FROM_EMAIL") ?? ""
    const name = this.configService.get<string>("MAILGUN_FROM_NAME")
    if (!name) {
      return email
    }
    return `${name} <${email}>`
  }

  private getDomain(): string {
    const domain = this.configService.get<string>("MAILGUN_DOMAIN")
    if (!domain) {
      throw new Error("MAILGUN_DOMAIN is not configured")
    }
    return domain
  }

  private async ensureMinimumResponseTime(startedAt: number): Promise<void> {
    const elapsed = Date.now() - startedAt
    const remaining = Math.max(
      PasswordResetService.MIN_RESPONSE_TIME_MS - elapsed,
      0
    )
    if (remaining === 0) {
      return
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, remaining)
    })
  }
}
