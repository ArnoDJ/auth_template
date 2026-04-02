import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UsePipes,
  Inject,
  Res,
  HttpCode,
  Headers,
  Param,
  Logger,
  ValidationPipe,
  UseGuards
} from "@nestjs/common"
import { Response } from "express"
import {
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiConflictResponse
} from "@nestjs/swagger"
import {
  AuthenticationDto,
  RegisterDto,
  ResendVerificationEmailDto
} from "../../../dto/authentication.dto"
import { AuthenticationResultDto } from "../../../dto/authenticationResult.dto"
import { ChangeAuthenticatedPasswordDto } from "../../../dto/changeAuthenticatedPassword.dto"
import { UpdateCurrentUserDto } from "../../../dto/updateCurrentUser.dto"
import { UserDto } from "../../../dto/user.dto"
import { AuthenticateService } from "../services/authentication/authenticate.service"
import { ChangeAuthenticatedPasswordService } from "../services/authentication/changeAuthenticatedPassword.service"
import { SendEmailVerificationService } from "../services/authentication/sendEmailVerification.service"
import { VerifyEmailService } from "../services/authentication/verifyEmail.service"
import { BuildCookieWithRefreshTokenService } from "../services/refresh-token/buildCookieWithRefreshToken.service"
import { FindOrCreateRefreshTokenStateService } from "../services/refresh-token/findOrCreateRefreshTokenState.service"
import { BuildAccessTokenService } from "../services/authentication/buildAccessToken.service"
import { BuildRefreshTokenService } from "../services/refresh-token/buildRefreshToken.service"
import { BuildCookieWithCsrfTokenService } from "../services/csrf/buildCookieWithCsrfToken.service"
import { BuildCsrfTokenService } from "../services/csrf/buildCsrfToken.service"
import { LogoutService } from "../services/refresh-token/logout.service"
import { CurrentUser } from "../../../decorators/currentUser.decorator"
import { JwtGuard } from "../guards/jwtGuard"
import { LoginRateLimitGuard } from "../guards/rateLimit.guard"
import { User } from "../entities/user"
import { CreateUserService } from "../../users/services/users/createUser.service"
import { GetUserByEmailService } from "../../users/services/users/getUserByEmail.service"
import { UpdateUserService } from "../../users/services/users/updateUser.service"

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(
    @Inject(AuthenticateService)
    private readonly authenticateService: AuthenticateService,
    @Inject(CreateUserService)
    private readonly createUserService: CreateUserService,
    @Inject(GetUserByEmailService)
    private readonly getUserByEmailService: GetUserByEmailService,
    @Inject(UpdateUserService)
    private readonly updateUserService: UpdateUserService,
    @Inject(SendEmailVerificationService)
    private readonly sendEmailVerificationService: SendEmailVerificationService,
    @Inject(ChangeAuthenticatedPasswordService)
    private readonly changeAuthenticatedPasswordService: ChangeAuthenticatedPasswordService,
    @Inject(VerifyEmailService)
    private readonly verifyEmailService: VerifyEmailService,
    @Inject(FindOrCreateRefreshTokenStateService)
    private readonly findOrCreateRefreshTokenStateService: FindOrCreateRefreshTokenStateService,
    @Inject(BuildCookieWithRefreshTokenService)
    private readonly buildCookieWithRefreshTokenService: BuildCookieWithRefreshTokenService,
    @Inject(BuildCookieWithCsrfTokenService)
    private readonly buildCookieWithCsrfTokenService: BuildCookieWithCsrfTokenService,
    @Inject(BuildAccessTokenService)
    private readonly buildAccessTokenService: BuildAccessTokenService,
    @Inject(BuildRefreshTokenService)
    private readonly buildRefreshTokenService: BuildRefreshTokenService,
    @Inject(BuildCsrfTokenService)
    private readonly buildCsrfTokenService: BuildCsrfTokenService,
    @Inject(LogoutService)
    private readonly logoutService: LogoutService
  ) {}

  @ApiOperation({ description: "authenticates a user with email and password" })
  @ApiOkResponse({
    description: "user successfully authenticated",
    type: AuthenticationResultDto
  })
  @ApiBadRequestResponse({ description: "invalid data provided" })
  @UsePipes(new ValidationPipe())
  @UseGuards(LoginRateLimitGuard)
  @Post("/token")
  @HttpCode(200)
  public async create(
    @Body() userData: AuthenticationDto,
    @Res() response: Response,
    @Headers("user-agent") userAgent?: string
  ): Promise<Response<AuthenticationResultDto>> {
    const user = await this.authenticateService.execute(userData)
    const refreshTokenData =
      await this.findOrCreateRefreshTokenStateService.execute(
        user.id,
        userAgent ?? "unknown"
      )
    const refreshToken = await this.buildRefreshTokenService.execute(
      refreshTokenData
    )
    const refreshTokenCookie = this.buildRefreshTokenCookie(refreshToken)
    const csrfCookie = this.buildCsrfCookie()
    const accessToken = await this.buildAccessTokenService.execute(user)
    response.setHeader("Set-Cookie", [refreshTokenCookie, csrfCookie])
    return response.send({ accessToken })
  }

  @ApiOperation({ description: "registers a user with email and password" })
  @ApiOkResponse({
    description: "user successfully registered"
  })
  @ApiBadRequestResponse({ description: "invalid data provided" })
  @ApiConflictResponse({ description: "email already exists" })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  )
  @Post("/register")
  @HttpCode(200)
  public async register(
    @Body() userData: RegisterDto
  ): Promise<{ message: string }> {
    const user = await this.createUserService.execute(userData)
    try {
      await this.sendEmailVerificationService.execute(user)
    } catch (error) {
      await this.rollbackFailedRegistration(user.id)
      throw error
    }
    return { message: "verification email sent" }
  }

  @ApiOperation({ description: "verifies a user's email address" })
  @ApiOkResponse({
    description: "email successfully verified"
  })
  @ApiBadRequestResponse({ description: "invalid or expired verification link" })
  @Post("/verify-email/:token")
  @HttpCode(200)
  public async verifyEmail(
    @Param("token") token: string
  ): Promise<{ message: string }> {
    await this.verifyEmailService.execute(token)
    return { message: "email verified" }
  }

  @ApiOperation({ description: "resends the email verification link" })
  @ApiOkResponse({
    description: "verification resend request accepted"
  })
  @ApiBadRequestResponse({ description: "invalid data provided" })
  @UsePipes(new ValidationPipe())
  @Post("/resend-verification-email")
  @HttpCode(200)
  public async resendVerificationEmail(
    @Body() payload: ResendVerificationEmailDto
  ): Promise<{ message: string }> {
    await this.processVerificationResend(payload.email)
    return {
      message:
        "if an unverified account exists for that email, a verification message was sent"
    }
  }

  @ApiOperation({
    description: "logs a user out by revoking his/her access token"
  })
  @ApiOkResponse({
    description: "user successfully logged out"
  })
  @UseGuards(JwtGuard)
  @Post("/logout")
  @HttpCode(200)
  public async logout(
    @CurrentUser() currentUser: User,
    @Headers("user-agent") userAgent?: string
  ): Promise<void> {
    return await this.logoutService.execute(
      currentUser.id,
      userAgent ?? "unknown"
    )
  }

  @ApiOperation({
    description: "returns the currently authenticated user"
  })
  @ApiOkResponse({
    description: "authenticated user returned",
    type: UserDto
  })
  @UseGuards(JwtGuard)
  @Get("/me")
  @HttpCode(200)
  public getMe(@CurrentUser() currentUser: UserDto): UserDto {
    return currentUser
  }

  @ApiOperation({
    description:
      "updates the authenticated user's profile (first and last name only)"
  })
  @ApiOkResponse({
    description: "authenticated user updated",
    type: UserDto
  })
  @ApiBadRequestResponse({ description: "invalid data provided" })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  )
  @UseGuards(JwtGuard)
  @Patch("/me")
  @HttpCode(200)
  public async updateMe(
    @CurrentUser() currentUser: UserDto,
    @Body() payload: UpdateCurrentUserDto
  ): Promise<UserDto> {
    return await this.updateUserService.execute(currentUser.id, payload)
  }

  @ApiOperation({
    description: "changes the authenticated user's password"
  })
  @ApiOkResponse({
    description: "password changed successfully"
  })
  @ApiBadRequestResponse({ description: "invalid data provided" })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  )
  @UseGuards(JwtGuard)
  @Post("/change-password")
  @HttpCode(200)
  public async changePassword(
    @CurrentUser() currentUser: User,
    @Body() payload: ChangeAuthenticatedPasswordDto
  ): Promise<{ message: string }> {
    await this.changeAuthenticatedPasswordService.execute(currentUser, payload)
    return { message: "password changed" }
  }

  private buildRefreshTokenCookie(refreshToken: string): string {
    return this.buildCookieWithRefreshTokenService.execute(refreshToken)
  }

  private buildCsrfCookie(): string {
    const csrfCookie = this.buildCsrfTokenService.execute()
    return this.buildCookieWithCsrfTokenService.execute(csrfCookie)
  }

  private async rollbackFailedRegistration(userId: string): Promise<void> {
    try {
      await this.sendEmailVerificationService.deleteTokensForUser(userId)
      await this.createUserService.deleteById(userId)
    } catch (cleanupError) {
      this.logger.error("Failed to rollback registration cleanup")
      this.logger.debug(String(cleanupError))
    }
  }

  private async processVerificationResend(email: string): Promise<void> {
    try {
      const user = await this.getUserByEmailService.execute(email)
      if (user.isActive) {
        return
      }
      await this.sendEmailVerificationService.execute(user)
    } catch (error) {
      this.logger.warn("Email verification resend request processing failed")
      this.logger.debug(String(error))
    }
  }
}
