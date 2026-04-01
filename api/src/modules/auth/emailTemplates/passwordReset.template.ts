import { User } from "../entities/user"

export function passwordResetEmailTemplate(
  user: User,
  resetUrl: string
): { subject: string; html: string } {
  return {
    subject: "Password reset",
    html: `
      <p>Hello ${user.firstName},</p>
      <p>You requested a password reset for your account.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link is valid for 10 minutes.</p>
    `
  }
}
