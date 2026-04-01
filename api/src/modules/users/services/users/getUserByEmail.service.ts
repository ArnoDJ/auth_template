import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { User } from "../../../../modules/auth/entities/user"
import { Repository } from "typeorm"

@Injectable()
export class GetUserByEmailService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {}

  public async execute(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email }
    })
    if (!user) {
      throw new NotFoundException(`user with email: ${email} does not exist`)
    }
    return user
  }
}
