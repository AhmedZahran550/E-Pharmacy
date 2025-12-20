import { MigrationInterface, QueryRunner } from "typeorm";

export class AddmedicalPro1766245826743 implements MigrationInterface {
    name = 'AddmedicalPro1766245826743'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."medical_profile_blood_type_enum" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`);
        await queryRunner.query(`CREATE TYPE "public"."medical_profile_allergies_enum" AS ENUM('penicillin', 'peanuts', 'latex', 'shellfish', 'dairy', 'egg', 'soy', 'wheat', 'tree_nuts', 'fish', 'sulfa_drugs', 'insulin', 'aspirin', 'iodine', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."medical_profile_chronic_conditions_enum" AS ENUM('diabetes_type_1', 'diabetes_type_2', 'hypertension', 'asthma', 'arthritis', 'heart_disease', 'kidney_disease', 'thyroid_disorder', 'high_cholesterol', 'depression', 'anxiety', 'migraine', 'osteoporosis', 'other')`);
        await queryRunner.query(`CREATE TABLE "medical_profile" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "blood_type" "public"."medical_profile_blood_type_enum", "allergies" "public"."medical_profile_allergies_enum" array, "chronic_conditions" "public"."medical_profile_chronic_conditions_enum" array, "current_medications" text array, "height" numeric(10,2), "weight" numeric(10,2), "insurance_provider" character varying, "insurance_policy_number" character varying, "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" character varying, "deleted_by" character varying, "version" integer, CONSTRAINT "REL_45379e692721d2ccd4cc3a8b29" UNIQUE ("user_id"), CONSTRAINT "PK_medical_profile_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" ADD "is_medical_profile_completed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "medical_profile" ADD CONSTRAINT "FK_medical_profile_user_id_to_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_profile" DROP CONSTRAINT "FK_medical_profile_user_id_to_user"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_medical_profile_completed"`);
        await queryRunner.query(`DROP TABLE "medical_profile"`);
        await queryRunner.query(`DROP TYPE "public"."medical_profile_chronic_conditions_enum"`);
        await queryRunner.query(`DROP TYPE "public"."medical_profile_allergies_enum"`);
        await queryRunner.query(`DROP TYPE "public"."medical_profile_blood_type_enum"`);
    }

}
