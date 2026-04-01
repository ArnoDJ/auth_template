/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable, UnauthorizedException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { User } from "../../entities/user"
import { LoginAttemptResultEnum } from "../../enums/loginAttemptResult.enum"

const LOCKOUT_START_ATTEMPT = 5
const MAX_LOCKOUT_MINUTES = 24 * 60
const SUCCESS_DECREMENT = 2
const JITTER_PERCENT = 0.1

@Injectable()
export class AccountLockoutService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  public async execute(
    user: User,
    result: LoginAttemptResultEnum
  ): Promise<void> {
    this.validateUserIsNotLocked(user)
    if (result === LoginAttemptResultEnum.FAILURE) {
      await this.storeFailedAttempt(user)
      return
    }

    await this.storeSuccessfulAttempt(user)
  }

  private validateUserIsNotLocked(user: User): void {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException("not allowed")
    }
  }

  private async storeFailedAttempt(user: User): Promise<void> {
    const failedLoginAttempts = user.failedLoginAttempts + 1
    const lockedUntil = this.buildLockedUntil(failedLoginAttempts)

    await this.userRepository.update(user.id, {
      failedLoginAttempts,
      lockedUntil
    })
  }

  private async storeSuccessfulAttempt(user: User): Promise<void> {
    const failedLoginAttempts = Math.max(
      user.failedLoginAttempts - SUCCESS_DECREMENT,
      0
    )

    await this.userRepository.update(user.id, {
      failedLoginAttempts,
      lockedUntil: null
    })
  }

  private buildLockedUntil(failedLoginAttempts: number): Date | null {
    const lockoutMinutes = this.calculateLockoutMinutes(failedLoginAttempts)
    if (lockoutMinutes === 0) {
      return null
    }

    return new Date(Date.now() + lockoutMinutes * 60_000)
  }

  private calculateLockoutMinutes(failedLoginAttempts: number): number {
    if (failedLoginAttempts < LOCKOUT_START_ATTEMPT) {
      return 0
    }

    const exponent = failedLoginAttempts - LOCKOUT_START_ATTEMPT
    const baseMinutes = Math.pow(3, exponent)
    const cappedMinutes = Math.min(baseMinutes, MAX_LOCKOUT_MINUTES)
    return this.applyJitter(cappedMinutes)
  }

  private applyJitter(minutes: number): number {
    const jitter = minutes * JITTER_PERCENT
    const offset = (Math.random() * 2 - 1) * jitter
    return Math.max(1, Math.round(minutes + offset))
  }
}
