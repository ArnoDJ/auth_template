import { Inject, Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { UserDto } from "../../../../dto/user.dto"
import { UpdateCurrentUserDto } from "../../../../dto/updateCurrentUser.dto"
import { User } from "../../../auth/entities/user"
import { Repository } from "typeorm"
import { GetUserByIdService } from "./getUserById.service"

@Injectable()
export class UpdateUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(GetUserByIdService)
    private readonly getUserByIdService: GetUserByIdService
  ) {}

  public async execute(
    userId: string,
    payload: UpdateCurrentUserDto
  ): Promise<UserDto> {
    await this.getUserByIdService.execute(userId)

    await this.userRepository.update(
      { id: userId },
      {
        firstName: payload.firstName,
        lastName: payload.lastName,
        updatedAt: new Date()
      }
    )

    return await this.getUserByIdService.execute(userId)
  }
}
