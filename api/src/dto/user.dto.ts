import { ApiProperty } from "@nestjs/swagger"
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator"
import { SubscriptionBillingCycleEnum } from "../enums/subscriptionBillingCycle.enum"
import { SubscriptionPlanEnum } from "../enums/subscriptionPlan.enum"
import { SubscriptionStatusEnum } from "../enums/subscriptionStatus.enum"

export class UserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public id: string

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
  @IsBoolean()
  public admin: boolean

  @ApiProperty()
  @IsBoolean()
  public isActive: boolean

  @ApiProperty({ enum: SubscriptionPlanEnum })
  @IsOptional()
  @IsEnum(SubscriptionPlanEnum)
  public subscriptionPlan: SubscriptionPlanEnum

  @ApiProperty({ nullable: true, enum: SubscriptionBillingCycleEnum })
  @IsOptional()
  @IsEnum(SubscriptionBillingCycleEnum)
  public subscriptionBillingCycle: SubscriptionBillingCycleEnum | null

  @ApiProperty({ enum: SubscriptionStatusEnum })
  @IsOptional()
  @IsEnum(SubscriptionStatusEnum)
  public subscriptionStatus: SubscriptionStatusEnum

  @ApiProperty({ nullable: true })
  @IsOptional()
  public subscriptionEndsAt: Date | null

  @ApiProperty()
  public createdAt: Date

  @ApiProperty()
  public updatedAt: Date
}
