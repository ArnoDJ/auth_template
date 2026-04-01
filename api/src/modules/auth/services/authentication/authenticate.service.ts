
import { Injectable, Inject, UnauthorizedException } from "@nestjs/common"
import { GetUserByEmailService } from "../../../users/services/users/getUserByEmail.service"
import { compare } from "bcrypt"
import { AuthenticationDto } from "../../../../dto/authentication.dto"
import { UserDto } from "../../../../dto/user.dto"
import { User } from "../../entities/user"
import { AccountLockoutService } from "./accountLockout.service"
import { LoginAttemptResultEnum } from "../../enums/loginAttemptResult.enum"

// eslint-disable-next-line @typescript-eslint/naming-convention
const DUMMY_PASSWORD_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8vGZ4l5Q8R1R7ZJ1J1Z1Z1Z1Z1Z1Z"

@Injectable()
export class AuthenticateService {
  constructor(
    @Inject(GetUserByEmailService)
    private readonly getUserByEmailService: GetUserByEmailService,
    @Inject(AccountLockoutService)
    private readonly accountLockoutService: AccountLockoutService
  ) {}

  public async execute(data: AuthenticationDto): Promise<UserDto> {
    const user = await this.retrieveUser(data.email, data.password)
    this.ensureUserIsActive(user)
    const isPasswordMatch = await this.isPasswordValid(data.password, user)
    if (!isPasswordMatch) {
      await this.accountLockoutService.execute(
        user,
        LoginAttemptResultEnum.FAILURE
      )
      throw new UnauthorizedException("not allowed")
    }

    await this.accountLockoutService.execute(
      user,
      LoginAttemptResultEnum.SUCCESS
    )
    return this.mapToUserDto(user)
  }

  private async retrieveUser(email: string, password: string): Promise<User> {
    try {
      return await this.getUserByEmail(email)
    } catch {
      await this.compareWithDummyHash(password)
      throw new UnauthorizedException("not allowed")
    }
  }

  private async getUserByEmail(email: string): Promise<User> {
    return await this.getUserByEmailService.execute(email)
  }

  private async compareWithDummyHash(password: string): Promise<void> {
    await compare(password, DUMMY_PASSWORD_HASH).catch(() => false)
  }

  private async isPasswordValid(
    password: string,
    user: User
  ): Promise<boolean> {
    return await compare(password, user.password)
  }

  private ensureUserIsActive(user: User): void {
    if (!user.isActive) {
      throw new UnauthorizedException("not allowed")
    }
  }

  private mapToUserDto(user: User): UserDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      admin: user.admin,
      isActive: user.isActive,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionBillingCycle: user.subscriptionBillingCycle,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt
    }
  }
}
