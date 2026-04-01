import { ApiProperty } from "@nestjs/swagger"
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm"
import { User } from "./user"

@Entity("refresh_tokens")
@Index(["userId", "userAgent"], { unique: true })
export class RefreshToken extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  public id: string

  @ApiProperty()
  @Column({ name: "user_agent", nullable: false })
  public userAgent: string

  @ApiProperty()
  @Column({ name: "revoked", nullable: false })
  public revoked: boolean

  @ApiProperty()
  @Column({ name: "token_version", type: "integer", default: 0 })
  public tokenVersion: number

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  public createdAt: Date

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  public updatedAt: Date

  @ApiProperty()
  @Index()
  @Column({ name: "user_id", nullable: false })
  public userId: string

  @ManyToOne(() => User, (user: User) => user.refreshTokens, {})
  @JoinColumn({ referencedColumnName: "id", name: "user_id" })
  public user: User
}
