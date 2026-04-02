import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException
} from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { compare, hash } from "bcrypt"
import { ChangeAuthenticatedPasswordDto } from "../../../../dto/changeAuthenticatedPassword.dto"
import { UserDto } from "../../../../dto/user.dto"
import { Repository } from "typeorm"
import { User } from "../../entities/user"
import { RevokeAllRefreshTokensForUserService } from "../refresh-token/revokeAllRefreshTokensForUser.service"

@Injectable()
export class ChangeAuthenticatedPasswordService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(RevokeAllRefreshTokensForUserService)
    private readonly revokeAllRefreshTokensForUserService: RevokeAllRefreshTokensForUserService
  ) {}

  public async execute(
    currentUser: UserDto,
    payload: ChangeAuthenticatedPasswordDto
  ): Promise<void> {
    this.ensurePasswordsMatch(payload)

    const user = await this.userRepository.findOne({
      where: { id: currentUser.id }
    })
    if (!user) {
      throw new UnauthorizedException("not allowed")
    }

    const isCurrentPasswordValid = await compare(
      payload.currentPassword,
      user.password
    )
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException("current password is incorrect")
    }

    const hashedPassword = await hash(payload.newPassword, 10)
    await this.userRepository.update(
      { id: user.id },
      {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date()
      }
    )
    await this.revokeAllRefreshTokensForUserService.execute(user.id)
  }

  private ensurePasswordsMatch(
    payload: ChangeAuthenticatedPasswordDto
  ): void {
    if (payload.newPassword !== payload.newPasswordConfirmation) {
      throw new BadRequestException("new password confirmation does not match")
    }
  }
}
