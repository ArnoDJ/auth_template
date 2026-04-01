import {
  Controller,
  Post,
  UsePipes,
  Inject,
  Res,
  HttpCode,
  ValidationPipe,
  Req,
  UnauthorizedException,
  UseGuards,
  Headers
} from "@nestjs/common"
import { Response } from "express"
import {
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse
} from "@nestjs/swagger"
import { Request } from "express"
import { AuthenticationResultDto } from "../../../dto/authenticationResult.dto"
import { RefreshTokenService } from "../services/refresh-token/refreshToken.service"
import { BuildCookieWithCsrfTokenService } from "../services/csrf/buildCookieWithCsrfToken.service"
import { BuildCsrfTokenService } from "../services/csrf/buildCsrfToken.service"
import { CsrfGuard } from "../guards/csrfGuard"
import { RefreshTokenRateLimitGuard } from "../guards/rateLimit.guard"

@ApiTags("Auth")
@Controller("auth")
@UseGuards(CsrfGuard)
export class RefreshTokenController {
  constructor(
    @Inject(RefreshTokenService)
    private readonly refreshTokenService: RefreshTokenService,
    @Inject(BuildCookieWithCsrfTokenService)
    private readonly buildCsrfCookieService: BuildCookieWithCsrfTokenService,
    @Inject(BuildCsrfTokenService)
    private readonly buildCsrfTokenService: BuildCsrfTokenService
  ) {}

  @ApiOperation({ description: "refresh access token" })
  @ApiOkResponse({
    description: "successfully refreshed access token",
    type: AuthenticationResultDto
  })
  @ApiBadRequestResponse({ description: "invalid data provided" })
  @UsePipes(new ValidationPipe())
  @UseGuards(RefreshTokenRateLimitGuard)
  @Post("/refresh_token")
  @HttpCode(200)
  public async create(
    @Res() response: Response,
    @Req() request: Request,
    @Headers("user-agent") userAgent?: string
  ): Promise<Response<AuthenticationResultDto>> {
    const refreshTokenFromRequest = this.getRefreshTokenFromCookie(request)
    if (!refreshTokenFromRequest) {
      throw new UnauthorizedException("not allowed")
    }
    const { accessToken, cookie } =
      await this.refreshTokenService.execute(
        refreshTokenFromRequest,
        userAgent ?? "unknown"
      )
    const csrfCookie = this.buildCsrfCookie()
    response.setHeader("Set-Cookie", [cookie, csrfCookie])
    return response.send({ accessToken })
  }

  private getRefreshTokenFromCookie(request: Request): string | undefined {
    const cookies: { refreshToken?: string } = request.cookies as {
      refreshToken?: string
    }
    return cookies["refreshToken"]
  }

  private buildCsrfCookie(): string {
    const csrfCookie = this.buildCsrfTokenService.execute()
    return this.buildCsrfCookieService.execute(csrfCookie)
  }
}
