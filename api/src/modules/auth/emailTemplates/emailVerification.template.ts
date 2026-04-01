import { UserDto } from "../../../dto/user.dto"

export function emailVerificationTemplate(
  user: UserDto,
  verificationUrl: string
): { subject: string; html: string } {
  return {
    subject: "Verify your email address",
    html: `
      <p>Hello ${user.firstName},</p>
      <p>Welcome to BK Connect.</p>
      <p><a href="${verificationUrl}">Verify your email address</a></p>
      <p>This link is valid for 24 hours.</p>
    `
  }
}
