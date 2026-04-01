import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"

export class ChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public password: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public passwordConfirmation: string
}
