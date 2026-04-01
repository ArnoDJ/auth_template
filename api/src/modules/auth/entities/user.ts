import { ApiProperty } from "@nestjs/swagger"
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { SubscriptionBillingCycleEnum } from "../../../enums/subscriptionBillingCycle.enum"
import { SubscriptionPlanEnum } from "../../../enums/subscriptionPlan.enum"
import { SubscriptionStatusEnum } from "../../../enums/subscriptionStatus.enum"
import { EmailVerificationToken } from "./emailVerificationToken"
import { RefreshToken } from "./refreshToken"
import { PasswordResetToken } from "./passwordResetToken"

@Entity("users")
export class User extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  public id: string

  @ApiProperty()
  @Column({ name: "first_name", nullable: false })
  public firstName: string

  @ApiProperty()
  @Column({ name: "last_name", nullable: false })
  public lastName: string

  @ApiProperty()
  @Column({ name: "email", nullable: false })
  public email: string

  @ApiProperty()
  @Column({ name: "password", nullable: false })
  public password: string

  @ApiProperty()
  @Column({ name: "admin", default: false })
  public admin: boolean

  @ApiProperty()
  @Column({ name: "is_active", default: true })
  public isActive: boolean

  @ApiProperty()
  @Column({
    name: "subscription_plan",
    type: "enum",
    enum: SubscriptionPlanEnum,
    default: SubscriptionPlanEnum.FREE,
  })
  public subscriptionPlan: SubscriptionPlanEnum

  @ApiProperty({ nullable: true })
  @Column({
    name: "subscription_billing_cycle",
    type: "enum",
    enum: SubscriptionBillingCycleEnum,
    nullable: true,
  })
  public subscriptionBillingCycle: SubscriptionBillingCycleEnum | null

  @ApiProperty()
  @Column({
    name: "subscription_status",
    type: "enum",
    enum: SubscriptionStatusEnum,
    default: SubscriptionStatusEnum.NONE,
  })
  public subscriptionStatus: SubscriptionStatusEnum

  @ApiProperty({ nullable: true })
  @Column({
    name: "subscription_ends_at",
    type: "timestamp with time zone",
    nullable: true,
  })
  public subscriptionEndsAt: Date | null

  @ApiProperty()
  @Column({ name: "failed_login_attempts", default: 0 })
  public failedLoginAttempts: number

  @ApiProperty({ nullable: true })
  @Column({
    name: "locked_until",
    type: "timestamp with time zone",
    nullable: true,
  })
  public lockedUntil: Date | null

  @ApiProperty()
  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  public createdAt: Date

  @ApiProperty()
  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  public updatedAt: Date

  @OneToMany(() => RefreshToken, (refreshToken: RefreshToken) => refreshToken.user)
  @JoinColumn({ referencedColumnName: "id" })
  public refreshTokens?: RefreshToken[]

  @OneToMany(
    () => PasswordResetToken,
    (passwordResetToken: PasswordResetToken) => passwordResetToken.user
  )
  @JoinColumn({ referencedColumnName: "id" })
  public passwordResetTokens?: PasswordResetToken[]

  @OneToMany(
    () => EmailVerificationToken,
    (emailVerificationToken: EmailVerificationToken) =>
      emailVerificationToken.user
  )
  @JoinColumn({ referencedColumnName: "id" })
  public emailVerificationTokens?: EmailVerificationToken[]
}
