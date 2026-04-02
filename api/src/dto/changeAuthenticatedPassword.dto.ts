import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"

export class ChangeAuthenticatedPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public currentPassword: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public newPassword: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public newPasswordConfirmation: string
}
