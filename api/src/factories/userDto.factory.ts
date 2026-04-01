import { SubscriptionPlanEnum } from "../enums/subscriptionPlan.enum"
import { UserDto } from "../dto/user.dto"
import { SubscriptionStatusEnum } from "../enums/subscriptionStatus.enum"

export const buildUserDto = (
  overrides: Partial<UserDto> = {}
): UserDto => {
  return {
    id: "user-id",
    firstName: "Tony",
    lastName: "Stark",
    email: "tony@stark.com",
    admin: false,
    isActive: true,
    subscriptionPlan: SubscriptionPlanEnum.FREE,
    subscriptionBillingCycle: null,
    subscriptionStatus: SubscriptionStatusEnum.ACTIVE,
    subscriptionEndsAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}
