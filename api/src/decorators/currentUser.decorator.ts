import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import { Request } from "express"

// eslint-disable-next-line @typescript-eslint/naming-convention
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest()
    return (request as Request & { user?: unknown }).user
  }
)
