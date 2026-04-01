import { MigrationInterface, QueryRunner } from "typeorm"

export class HardenAuthRefreshTokens1743350000000 implements MigrationInterface {
  name = "HardenAuthRefreshTokens1743350000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
      ADD COLUMN IF NOT EXISTS token_version integer NOT NULL DEFAULT 0
    `)

    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY user_id, user_agent
            ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
          ) AS rn
        FROM refresh_tokens
      )
      DELETE FROM refresh_tokens
      WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_refresh_tokens_user_id_user_agent
      ON refresh_tokens (user_id, user_agent)
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_password_reset_tokens_token
      ON password_reset_tokens (token)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS ux_password_reset_tokens_token
    `)

    await queryRunner.query(`
      DROP INDEX IF EXISTS ux_refresh_tokens_user_id_user_agent
    `)

    await queryRunner.query(`
      ALTER TABLE refresh_tokens
      DROP COLUMN IF EXISTS token_version
    `)
  }
}
