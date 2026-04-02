import { MigrationInterface, QueryRunner } from "typeorm"

export class AddAdminFlagToUsers1743580000000 implements MigrationInterface {
  name = "AddAdminFlagToUsers1743580000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS admin boolean
    `)

    await queryRunner.query(`
      UPDATE users
      SET admin = false
      WHERE admin IS NULL
    `)

    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN admin SET DEFAULT false
    `)

    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN admin SET NOT NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS admin
    `)
  }
}
