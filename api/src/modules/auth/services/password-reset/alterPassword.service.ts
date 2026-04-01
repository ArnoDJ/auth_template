import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { hash } from "bcrypt"
import { createHash } from "crypto"
import { ChangePasswordDto } from "../../../../dto/changePassword.dto"
import { Repository } from "typeorm"
import { PasswordResetToken } from "../../entities/passwordResetToken"
import { User } from "../../entities/user"
import { RevokeAllRefreshTokensForUserService } from "../refresh-token/revokeAllRefreshTokensForUser.service"

@Injectable()
export class AlterPasswordService {
  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(RevokeAllRefreshTokensForUserService)
    private readonly revokeAllRefreshTokensForUserService: RevokeAllRefreshTokensForUserService
  ) {}

  public async execute(
    changePasswordData: ChangePasswordDto,
    token: string
  ): Promise<void> {
    this.checkIfPasswordsMatch(changePasswordData)
    const passwordResetToken = await this.getPasswordResetToken(token)
    const user = await this.getUserFromTokenData(passwordResetToken.userId)
    const newPassword = await this.hashPassword(changePasswordData.password)
    await this.updatePassword(user.id, newPassword)
    await this.revokeAllRefreshTokensForUserService.execute(user.id)
    await this.passwordResetTokenRepository.delete({ userId: user.id })
  }

  private async updatePassword(
    userId: string,
    password: string
  ): Promise<void> {
    await this.userRepository.update(
      { id: userId },
      {
        password,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date()
      }
    )
  }

  private checkIfPasswordsMatch(changePasswordData: ChangePasswordDto): void {
    if (changePasswordData.password !== changePasswordData.passwordConfirmation) {
      throw new BadRequestException("passwords don't match")
    }
  }

  private async getPasswordResetToken(
    token: string
  ): Promise<PasswordResetToken> {
    const hashedToken = this.hashToken(token)
    const passwordResetToken = await this.passwordResetTokenRepository.findOne({
      where: { token: hashedToken }
    })
    if (!passwordResetToken) {
      throw new BadRequestException("link has expired")
    }

    if (passwordResetToken.validUntil > new Date()) {
      return passwordResetToken
    }
    throw new BadRequestException("link has expired")
  }

  private async getUserFromTokenData(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException("user with id from token does not exist")
    }
    return user
  }

  private async hashPassword(password: string): Promise<string> {
    return await hash(password, 10)
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex")
  }
}
