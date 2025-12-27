import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameMidecen1766842269233 implements MigrationInterface {
    name = 'RenameMidecen1766842269233'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_request_messages" DROP CONSTRAINT "FK_service_request_messages_service_request_id_to_service_reque"`);
        await queryRunner.query(`CREATE TYPE "public"."medicine_schedules_frequency_enum" AS ENUM('ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY', 'EVERY_X_HOURS', 'AS_NEEDED', 'CUSTOM')`);
        await queryRunner.query(`CREATE TABLE "medicine_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "medicine_name" character varying(255) NOT NULL, "instructions" text, "frequency" "public"."medicine_schedules_frequency_enum" NOT NULL, "frequency_value" integer, "times" jsonb, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE, "duration_days" integer, "reminder_enabled" boolean NOT NULL DEFAULT true, "reminder_minutes_before" integer NOT NULL DEFAULT '15', "is_active" boolean NOT NULL DEFAULT true, "notes" text, "user_id" uuid NOT NULL, "item_id" uuid, "consultation_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" character varying, "deleted_by" character varying, "version" integer, CONSTRAINT "PK_medicine_schedules_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" ADD CONSTRAINT "FK_service_request_messages_service_request_id_to_service_requests" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medicine_schedules" ADD CONSTRAINT "FK_medicine_schedules_user_id_to_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medicine_schedules" ADD CONSTRAINT "FK_medicine_schedules_item_id_to_item" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medicine_schedules" ADD CONSTRAINT "FK_medicine_schedules_consultation_id_to_consultations" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medicine_schedules" DROP CONSTRAINT "FK_medicine_schedules_consultation_id_to_consultations"`);
        await queryRunner.query(`ALTER TABLE "medicine_schedules" DROP CONSTRAINT "FK_medicine_schedules_item_id_to_item"`);
        await queryRunner.query(`ALTER TABLE "medicine_schedules" DROP CONSTRAINT "FK_medicine_schedules_user_id_to_user"`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" DROP CONSTRAINT "FK_service_request_messages_service_request_id_to_service_requests"`);
        await queryRunner.query(`DROP TABLE "medicine_schedules"`);
        await queryRunner.query(`DROP TYPE "public"."medicine_schedules_frequency_enum"`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" ADD CONSTRAINT "FK_service_request_messages_service_request_id_to_service_reque" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
