import { ApiProperty } from "@nestjs/swagger"

export class AuthenticationResultDto {
  @ApiProperty()
  public accessToken: string
}
