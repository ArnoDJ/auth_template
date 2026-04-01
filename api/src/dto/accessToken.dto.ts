import { ApiProperty } from "@nestjs/swagger"
import { IsBoolean, IsString } from "class-validator"

export class AccessTokenDto {
  @ApiProperty({ required: true })
  @IsString()
  public sub: string

  @ApiProperty({ required: true, default: false })
  @IsBoolean()
  public admin: boolean
}
