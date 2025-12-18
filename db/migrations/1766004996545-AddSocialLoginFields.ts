import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSocialLoginFields1766004996545 implements MigrationInterface {
    name = 'AddSocialLoginFields1766004996545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_provider_enum" AS ENUM('local', 'google', 'facebook', 'apple')`);
        await queryRunner.query(`ALTER TABLE "user" ADD "provider" "public"."user_provider_enum" NOT NULL DEFAULT 'local'`);
        await queryRunner.query(`ALTER TABLE "user" ADD "google_id" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_7adac5c0b28492eb292d4a93871" UNIQUE ("google_id")`);
        await queryRunner.query(`ALTER TABLE "user" ADD "facebook_id" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_189473aaba06ffd667bb024e71a" UNIQUE ("facebook_id")`);
        await queryRunner.query(`ALTER TABLE "user" ADD "apple_id" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_fda2d885fb612212b85752f5ab1" UNIQUE ("apple_id")`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_fda2d885fb612212b85752f5ab1"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "apple_id"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_189473aaba06ffd667bb024e71a"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "facebook_id"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_7adac5c0b28492eb292d4a93871"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "google_id"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "provider"`);
        await queryRunner.query(`DROP TYPE "public"."user_provider_enum"`);
    }

}
