import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { InjectRepository } from "@nestjs/typeorm"
import { createHash, randomBytes } from "crypto"
import FormData from "form-data"
import Mailgun from "mailgun.js"
import { Repository } from "typeorm"
import { UserDto } from "../../../../dto/user.dto"
import { EmailVerificationToken } from "../../entities/emailVerificationToken"
import { emailVerificationTemplate } from "../../emailTemplates/emailVerification.template"

@Injectable()
export class SendEmailVerificationService {
  private static readonly TTL_HOURS = 24
  private readonly logger = new Logger(SendEmailVerificationService.name)

  constructor(
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
    @Inject(ConfigService)
    private readonly configService: ConfigService
  ) {}

  public async execute(user: UserDto): Promise<void> {
    await this.removeExistingTokens(user.id)
    const token = this.buildToken()
    await this.createEmailVerificationToken(user.id, this.hashToken(token))
    await this.sendEmail(user, this.buildVerificationUrl(token))
  }

  public async deleteTokensForUser(userId: string): Promise<void> {
    await this.removeExistingTokens(userId)
  }

  private async removeExistingTokens(userId: string): Promise<void> {
    await this.emailVerificationTokenRepository.delete({ userId })
  }

  private async createEmailVerificationToken(
    userId: string,
    token: string
  ): Promise<void> {
    await this.emailVerificationTokenRepository.save({
      userId,
      token,
      validUntil: new Date(
        Date.now() + SendEmailVerificationService.TTL_HOURS * 60 * 60_000
      )
    })
  }

  private buildToken(): string {
    return randomBytes(32).toString("hex")
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex")
  }

  private buildVerificationUrl(token: string): string {
    const frontendBaseUrl =
      this.configService.get<string>("FRONTEND_BASE_URL") ??
      this.configService.get<string>("APP_URL") ??
      "http://localhost:3000"
    const trimmedBaseUrl = frontendBaseUrl.endsWith("/")
      ? frontendBaseUrl.slice(0, -1)
      : frontendBaseUrl

    return `${trimmedBaseUrl}/verify-email/${token}`
  }

  private async sendEmail(
    user: UserDto,
    verificationUrl: string
  ): Promise<void> {
    try {
      const mailgun = new Mailgun(FormData)
      const client = mailgun.client({
        username: "api",
        key: this.configService.get<string>("MAILGUN_API_KEY") ?? "",
        url: this.configService.get<string>("MAILGUN_API_URL")
      })
      const domain = this.getDomain()
      const { subject, html } = emailVerificationTemplate(user, verificationUrl)

      await client.messages.create(domain, {
        from: this.buildFrom(),
        to: [`${user.firstName} ${user.lastName} <${user.email}>`],
        subject,
        html,
        text: `Verify your email using this link: ${verificationUrl}`
      })
    } catch (error) {
      this.logger.error("Email verification delivery failed")
      this.logger.debug(String(error))
      throw new ServiceUnavailableException(
        "unable to send verification email right now"
      )
    }
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
      throw new ServiceUnavailableException("mail provider is not configured")
    }
    return domain
  }
}
