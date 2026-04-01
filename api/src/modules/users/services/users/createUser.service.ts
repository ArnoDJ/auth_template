import {
  BadRequestException,
  ConflictException,
  Injectable
} from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { hash } from "bcrypt"
import { RegisterDto } from "../../../../dto/authentication.dto"
import { UserDto } from "../../../../dto/user.dto"
import { User } from "../../../auth/entities/user"
import { Repository } from "typeorm"

@Injectable()
export class CreateUserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {}

  public async execute(data: RegisterDto): Promise<UserDto> {
    this.ensurePasswordConfirmationMatches(data)
    await this.ensureEmailIsAvailable(data.email)

    const user = await this.userRepository.save({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: await hash(data.password, 10),
      admin: false,
      isActive: false
    })

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      admin: user.admin,
      isActive: user.isActive,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionBillingCycle: user.subscriptionBillingCycle,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }

  public async deleteById(id: string): Promise<void> {
    await this.userRepository.delete({ id })
  }

  private ensurePasswordConfirmationMatches(data: RegisterDto): void {
    if (data.password !== data.passwordConfirmation) {
      throw new BadRequestException("password confirmation does not match")
    }
  }

  private async ensureEmailIsAvailable(email: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { email }
    })
    if (existingUser) {
      throw new ConflictException("user with this email already exists")
    }
  }
}
