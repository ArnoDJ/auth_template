import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { User } from "../auth/entities/user"
import { CreateUserService } from "./services/users/createUser.service"
import { GetUserByEmailService } from "./services/users/getUserByEmail.service"
import { GetUserByIdService } from "./services/users/getUserById.service"
import { TypeOrmModule } from "@nestjs/typeorm"

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  providers: [CreateUserService, GetUserByEmailService, GetUserByIdService],
  exports: [CreateUserService, GetUserByEmailService, GetUserByIdService],
})
export class UsersModule {}
