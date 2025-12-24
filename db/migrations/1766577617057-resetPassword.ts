import { MigrationInterface, QueryRunner } from "typeorm";

export class ResetPassword1766577617057 implements MigrationInterface {
    name = 'ResetPassword1766577617057'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_reset_token" ADD "user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "password_reset_token" ADD CONSTRAINT "FK_password_reset_token_user_id_to_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_reset_token" DROP CONSTRAINT "FK_password_reset_token_user_id_to_user"`);
        await queryRunner.query(`ALTER TABLE "password_reset_token" DROP COLUMN "user_id"`);
    }

}
