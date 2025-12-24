import { MigrationInterface, QueryRunner } from "typeorm";

export class DoctorsRate1766608617658 implements MigrationInterface {
    name = 'DoctorsRate1766608617658'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "doctor_rating" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" numeric(2,1) NOT NULL, "notes" text, "user_id" uuid, "employee_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" character varying, "deleted_by" character varying, "version" integer, CONSTRAINT "PK_doctor_rating_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_doctor_rating_user_id_employee_id" ON "doctor_rating" ("user_id", "employee_id") `);
        await queryRunner.query(`ALTER TABLE "employee" ADD "average_rating" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "employee" ADD "total_raters" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "doctor_rating" ADD CONSTRAINT "FK_doctor_rating_user_id_to_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "doctor_rating" ADD CONSTRAINT "FK_doctor_rating_employee_id_to_employee" FOREIGN KEY ("employee_id") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor_rating" DROP CONSTRAINT "FK_doctor_rating_employee_id_to_employee"`);
        await queryRunner.query(`ALTER TABLE "doctor_rating" DROP CONSTRAINT "FK_doctor_rating_user_id_to_user"`);
        await queryRunner.query(`ALTER TABLE "employee" DROP COLUMN "total_raters"`);
        await queryRunner.query(`ALTER TABLE "employee" DROP COLUMN "average_rating"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_doctor_rating_user_id_employee_id"`);
        await queryRunner.query(`DROP TABLE "doctor_rating"`);
    }

}
