import { MigrationInterface, QueryRunner } from "typeorm";

export class OnlineDoctoers1766511715381 implements MigrationInterface {
    name = 'OnlineDoctoers1766511715381'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "branch" ADD "doctors_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "employee" ADD "is_online" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "employee" ADD "last_active_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employee" DROP COLUMN "last_active_at"`);
        await queryRunner.query(`ALTER TABLE "employee" DROP COLUMN "is_online"`);
        await queryRunner.query(`ALTER TABLE "branch" DROP COLUMN "doctors_count"`);
    }

}
