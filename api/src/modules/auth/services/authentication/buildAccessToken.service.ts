import { Inject, Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { UserDto } from "../../../../dto/user.dto"
import { AccessTokenDto } from "../../../../dto/accessToken.dto"

@Injectable()
export class BuildAccessTokenService {
  constructor(
    @Inject(JwtService)
    private readonly jwtService: JwtService
  ) {}

  public async execute(user: UserDto): Promise<string> {
    const payload = this.buildJwtPayload(user)
    return await this.jwtService.signAsync(payload)
  }

  private buildJwtPayload(user: UserDto): AccessTokenDto {
    return { sub: user.id, admin: user.admin }
  }
}
