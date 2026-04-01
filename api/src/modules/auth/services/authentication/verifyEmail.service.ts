import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { createHash } from "crypto"
import { Repository } from "typeorm"
import { EmailVerificationToken } from "../../entities/emailVerificationToken"
import { User } from "../../entities/user"

@Injectable()
export class VerifyEmailService {
  constructor(
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  public async execute(token: string): Promise<void> {
    const verificationToken = await this.getVerificationToken(token)
    const user = await this.userRepository.findOne({
      where: { id: verificationToken.userId }
    })
    if (!user) {
      throw new NotFoundException("user with id from token does not exist")
    }

    await this.userRepository.update(
      { id: user.id },
      {
        isActive: true,
        updatedAt: new Date()
      }
    )
    await this.emailVerificationTokenRepository.delete({ userId: user.id })
  }

  private async getVerificationToken(
    token: string
  ): Promise<EmailVerificationToken> {
    const hashedToken = this.hashToken(token)
    const verificationToken = await this.emailVerificationTokenRepository.findOne({
      where: { token: hashedToken }
    })
    if (!verificationToken || verificationToken.validUntil <= new Date()) {
      throw new BadRequestException("link has expired")
    }

    return verificationToken
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex")
  }
}
