import { ExtractJwt, Strategy } from "passport-jwt"
import { PassportStrategy } from "@nestjs/passport"
import { Injectable, Inject } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { GetUserByIdService } from "../../users/services/users/getUserById.service"
import { TokenPayload } from "../../../types/tokenPayload"
import { UserDto } from "../../../dto/user.dto"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) configService: ConfigService,
    @Inject(GetUserByIdService)
    private readonly getUserByIdService: GetUserByIdService
  ) {
    const jwtSecret = configService.getOrThrow<string>("JWT_SECRET")
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret
    })
  }

  async validate(payload: TokenPayload): Promise<UserDto> {
    return await this.getUserByIdService.execute(payload.sub)
  }
}
