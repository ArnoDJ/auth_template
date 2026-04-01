import { Injectable, NotFoundException } from "@nestjs/common"
import { UserDto } from "../../../../dto/user.dto"
import { InjectRepository } from "@nestjs/typeorm"
import { User } from "../../../../modules/auth/entities/user"
import { Repository } from "typeorm"

@Injectable()
export class GetUserByIdService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {}

  public async execute(id: string): Promise<UserDto> {
    const user = await this.userRepository.findOne({
      where: { id }
    })
    if (!user) {
      throw new NotFoundException(`user with id: ${id} does not exist`)
    }
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
}
