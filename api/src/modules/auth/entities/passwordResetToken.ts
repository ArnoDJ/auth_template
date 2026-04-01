import { ApiProperty } from "@nestjs/swagger"
import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm"
import { User } from "./user"

@Entity("password_reset_tokens")
export class PasswordResetToken extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  public id: string

  @ApiProperty()
  @Index()
  @Column({ name: "user_id", nullable: false })
  public userId: string

  @ManyToOne(() => User, (user: User) => user.passwordResetTokens, {})
  @JoinColumn({ referencedColumnName: "id", name: "user_id" })
  public user: User

  @ApiProperty()
  @Index({ unique: true })
  @Column({ name: "token", nullable: false })
  public token: string

  @ApiProperty()
  @Column({ name: "valid_until", type: "timestamp with time zone" })
  public validUntil: Date
}
