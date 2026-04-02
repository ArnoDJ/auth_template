import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { DatabaseModule } from "../database/database.module"
import { UsersModule } from "../users/users.module"
import { AuthController } from "./controllers/auth.controller"
import { PasswordResetController } from "./controllers/passwordReset.controller"
import { RefreshTokenController } from "./controllers/refreshToken.controller"
import { EmailVerificationToken } from "./entities/emailVerificationToken"
import { PasswordResetToken } from "./entities/passwordResetToken"
import { RefreshToken } from "./entities/refreshToken"
import { User } from "./entities/user"
import {
  LoginRateLimitGuard,
  PasswordResetRequestRateLimitGuard,
  RefreshTokenRateLimitGuard
} from "./guards/rateLimit.guard"
import { JwtStrategy } from "./strategies/jwt.strategy"
import { AccountLockoutService } from "./services/authentication/accountLockout.service"
import { AlterPasswordService } from "./services/password-reset/alterPassword.service"
import { AuthenticateService } from "./services/authentication/authenticate.service"
import { BuildAccessTokenService } from "./services/authentication/buildAccessToken.service"
import { ChangeAuthenticatedPasswordService } from "./services/authentication/changeAuthenticatedPassword.service"
import { SendEmailVerificationService } from "./services/authentication/sendEmailVerification.service"
import { VerifyEmailService } from "./services/authentication/verifyEmail.service"
import { BuildCookieWithCsrfTokenService } from "./services/csrf/buildCookieWithCsrfToken.service"
import { BuildCookieWithRefreshTokenService } from "./services/refresh-token/buildCookieWithRefreshToken.service"
import { BuildCsrfTokenService } from "./services/csrf/buildCsrfToken.service"
import { BuildRefreshTokenService } from "./services/refresh-token/buildRefreshToken.service"
import { FindOrCreateRefreshTokenStateService } from "./services/refresh-token/findOrCreateRefreshTokenState.service"
import { GetRefreshTokenStateByUserAndAgentService } from "./services/refresh-token/getRefreshTokenByUserAndAgent.service"
import { LogoutService } from "./services/refresh-token/logout.service"
import { PasswordResetService } from "./services/password-reset/passwordReset.service"
import { RefreshTokenService } from "./services/refresh-token/refreshToken.service"
import { RevokeAllRefreshTokensForUserService } from "./services/refresh-token/revokeAllRefreshTokensForUser.service"
import { VerifyCsrfTokenService } from "./services/csrf/verifyCsrfToken.service"
import { TypeOrmModule } from "@nestjs/typeorm"

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: `${configService.get<number>("JWT_ACCESS_TOKEN_EXPIRE_TIME") ?? 3800}s`,
        },
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      RefreshToken,
      PasswordResetToken,
      EmailVerificationToken,
    ]),
  ],
  controllers: [AuthController, RefreshTokenController, PasswordResetController],
  providers: [
    BuildCookieWithRefreshTokenService,
    AuthenticateService,
    ChangeAuthenticatedPasswordService,
    SendEmailVerificationService,
    VerifyEmailService,
    JwtStrategy,
    FindOrCreateRefreshTokenStateService,
    BuildAccessTokenService,
    BuildRefreshTokenService,
    BuildCookieWithCsrfTokenService,
    RefreshTokenService,
    VerifyCsrfTokenService,
    BuildCsrfTokenService,
    LogoutService,
    GetRefreshTokenStateByUserAndAgentService,
    AccountLockoutService,
    PasswordResetService,
    AlterPasswordService,
    RevokeAllRefreshTokensForUserService,
    LoginRateLimitGuard,
    RefreshTokenRateLimitGuard,
    PasswordResetRequestRateLimitGuard
  ],
  exports: [BuildAccessTokenService, JwtModule],
})
export class AuthModule {}
