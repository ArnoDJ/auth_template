import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsNotEmpty, IsEmail } from "class-validator"

export class AuthenticationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  public email: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public password: string
}

export class PasswordResetRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  public email: string
}

export class RegisterDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public firstName: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public lastName: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  public email: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public password: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public passwordConfirmation: string
}

export class ResendVerificationEmailDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  public email: string
}
