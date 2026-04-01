import {
  Controller,
  Post,
  Body,
  HttpCode,
  Param,
  Inject,
  UsePipes,
  ValidationPipe,
  UseGuards
} from "@nestjs/common"
import {
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse
} from "@nestjs/swagger"
import { PasswordResetRequestDto } from "../../../dto/authentication.dto"
import { ChangePasswordDto } from "../../../dto/changePassword.dto"
import { PasswordResetService } from "../services/password-reset/passwordReset.service"
import { AlterPasswordService } from "../services/password-reset/alterPassword.service"
import { PasswordResetRequestRateLimitGuard } from "../guards/rateLimit.guard"

@ApiTags("Auth")
@Controller("auth/password-reset")
export class PasswordResetController {
  constructor(
    @Inject(PasswordResetService)
    private readonly passwordResetService: PasswordResetService,
    @Inject(AlterPasswordService)
    private readonly alterPasswordService: AlterPasswordService
  ) {}

  @ApiOperation({ description: "requests a password reset" })
  @ApiBadRequestResponse({ description: "invalid data provided" })
  @Post("/request")
  @HttpCode(200)
  @UsePipes(new ValidationPipe())
  @UseGuards(PasswordResetRequestRateLimitGuard)
  public async reset(
    @Body() passwordResetRequestData: PasswordResetRequestDto
  ): Promise<void> {
    await this.passwordResetService.execute(passwordResetRequestData.email)
  }

  @ApiOperation({ description: "sets a new password" })
  @ApiBadRequestResponse({ description: "link expired" })
  @Post("/:token")
  @HttpCode(200)
  @UsePipes(new ValidationPipe())
  public async change(
    @Param("token") token: string,
    @Body() changePasswordDate: ChangePasswordDto
  ): Promise<void> {
    await this.alterPasswordService.execute(changePasswordDate, token)
  }
}
