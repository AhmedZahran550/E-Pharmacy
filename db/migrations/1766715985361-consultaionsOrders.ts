import { MigrationInterface, QueryRunner } from "typeorm";

export class ConsultaionsOrders1766715985361 implements MigrationInterface {
    name = 'ConsultaionsOrders1766715985361'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."order_request_messages_type_enum" AS ENUM('TEXT', 'IMAGE', 'DOCUMENT', 'SYSTEM')`);
        await queryRunner.query(`CREATE TYPE "public"."order_request_messages_sender_role_enum" AS ENUM('USER', 'DOCTOR', 'SYSTEM')`);
        await queryRunner.query(`CREATE TABLE "order_request_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."order_request_messages_type_enum" NOT NULL, "sender_role" "public"."order_request_messages_sender_role_enum" NOT NULL, "content" text NOT NULL, "message_metadata" jsonb, "is_read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP, "order_request_id" uuid NOT NULL, "sender_user_id" uuid, "sender_doctor_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" character varying, "deleted_by" character varying, "version" integer, CONSTRAINT "PK_order_request_messages_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."order_requests_type_enum" AS ENUM('PRESCRIPTION_IMAGE', 'ITEM_SELECTION', 'MANUAL_ENTRY', 'MIXED')`);
        await queryRunner.query(`CREATE TYPE "public"."order_requests_status_enum" AS ENUM('PENDING', 'REVIEWING', 'CLARIFICATION_NEEDED', 'COMPLETED', 'CANCELLED', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "order_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "request_no" character varying(20) NOT NULL, "type" "public"."order_requests_type_enum" NOT NULL, "status" "public"."order_requests_status_enum" NOT NULL DEFAULT 'PENDING', "prescription_images" jsonb, "selected_items" jsonb, "manual_items" jsonb, "notes" text, "assigned_at" TIMESTAMP, "reviewed_at" TIMESTAMP, "completed_at" TIMESTAMP, "expires_at" TIMESTAMP, "doctor_notes" text, "user_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "doctor_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" character varying, "deleted_by" character varying, "version" integer, CONSTRAINT "UQ_16feaa4d2baaf31fe03ae21e299" UNIQUE ("request_no"), CONSTRAINT "PK_order_requests_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."medication_schedules_frequency_enum" AS ENUM('ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY', 'EVERY_X_HOURS', 'AS_NEEDED', 'CUSTOM')`);
        await queryRunner.query(`CREATE TABLE "medication_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "medication_name" character varying(255) NOT NULL, "instructions" text, "frequency" "public"."medication_schedules_frequency_enum" NOT NULL, "frequency_value" integer, "times" jsonb, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE, "duration_days" integer, "reminder_enabled" boolean NOT NULL DEFAULT true, "reminder_minutes_before" integer NOT NULL DEFAULT '15', "is_active" boolean NOT NULL DEFAULT true, "notes" text, "user_id" uuid NOT NULL, "item_id" uuid, "consultation_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" character varying, "deleted_by" character varying, "version" integer, CONSTRAINT "PK_medication_schedules_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."consultation_messages_type_enum" AS ENUM('TEXT', 'IMAGE', 'DOCUMENT', 'MEDICATION_LINK', 'SYSTEM')`);
        await queryRunner.query(`CREATE TYPE "public"."consultation_messages_sender_role_enum" AS ENUM('USER', 'DOCTOR', 'SYSTEM')`);
        await queryRunner.query(`CREATE TABLE "consultation_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."consultation_messages_type_enum" NOT NULL, "sender_role" "public"."consultation_messages_sender_role_enum" NOT NULL, "content" text NOT NULL, "message_metadata" jsonb, "is_read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP, "consultation_id" uuid NOT NULL, "sender_user_id" uuid, "sender_doctor_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" character varying, "deleted_by" character varying, "version" integer, CONSTRAINT "PK_consultation_messages_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."consultations_type_enum" AS ENUM('GENERAL', 'MEDICATION_INQUIRY', 'PRESCRIPTION_REVIEW', 'SIDE_EFFECTS', 'DRUG_INTERACTION', 'DOSAGE_QUESTION', 'CHRONIC_CONDITION', 'NUTRITION_ADVICE')`);
        await queryRunner.query(`CREATE TYPE "public"."consultations_status_enum" AS ENUM('REQUESTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "consultations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "consultation_no" character varying(20) NOT NULL, "type" "public"."consultations_type_enum" NOT NULL, "status" "public"."consultations_status_enum" NOT NULL DEFAULT 'REQUESTED', "user_initial_message" text, "doctor_notes" text, "doctor_summary" text, "assigned_at" TIMESTAMP, "started_at" TIMESTAMP, "completed_at" TIMESTAMP, "expires_at" TIMESTAMP, "message_count" integer NOT NULL DEFAULT '0', "rating" numeric(3,2), "rating_notes" text, "uploaded_images" jsonb, "user_id" uuid NOT NULL, "doctor_id" uuid, "branch_id" uuid NOT NULL, "order_request_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" character varying, "deleted_by" character varying, "version" integer, CONSTRAINT "UQ_4ae65bc8087b830279041d163b4" UNIQUE ("consultation_no"), CONSTRAINT "REL_843dfc3c9a0c986a4e95d24193" UNIQUE ("order_request_id"), CONSTRAINT "PK_consultations_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "consultation_queue" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "position" integer NOT NULL, "enqueued_at" TIMESTAMP NOT NULL DEFAULT now(), "priority" integer NOT NULL DEFAULT '0', "consultation_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" character varying, "deleted_by" character varying, "version" integer, CONSTRAINT "PK_consultation_queue_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "employee" ADD "image_url" character varying`);
        await queryRunner.query(`ALTER TABLE "employee" ADD "available_for_consultation" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "employee" ADD "active_consultations_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "employee" ADD "max_concurrent_consultations" integer NOT NULL DEFAULT '3'`);
        await queryRunner.query(`ALTER TABLE "employee" ADD "is_visible_to_public" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "employee" ADD "specialties" text`);
        await queryRunner.query(`ALTER TABLE "employee" ADD "bio" text`);
        await queryRunner.query(`ALTER TABLE "employee" ADD "total_consultations" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD "doctor_instructions" text`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD "medication_timing" text`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD "schedule" jsonb`);
        await queryRunner.query(`ALTER TABLE "order" ADD "consultation_id" uuid`);
        await queryRunner.query(`ALTER TABLE "order" ADD "order_request_id" uuid`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "UQ_e7681af306c54c755d121299b69" UNIQUE ("order_request_id")`);
        await queryRunner.query(`ALTER TABLE "order" ADD "created_by_doctor_id" uuid`);
        await queryRunner.query(`ALTER TABLE "order_request_messages" ADD CONSTRAINT "FK_order_request_messages_order_request_id_to_order_requests" FOREIGN KEY ("order_request_id") REFERENCES "order_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_request_messages" ADD CONSTRAINT "FK_order_request_messages_sender_user_id_to_user" FOREIGN KEY ("sender_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_request_messages" ADD CONSTRAINT "FK_order_request_messages_sender_doctor_id_to_employee" FOREIGN KEY ("sender_doctor_id") REFERENCES "employee"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_requests" ADD CONSTRAINT "FK_order_requests_user_id_to_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_requests" ADD CONSTRAINT "FK_order_requests_branch_id_to_branch" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_requests" ADD CONSTRAINT "FK_order_requests_doctor_id_to_employee" FOREIGN KEY ("doctor_id") REFERENCES "employee"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_order_consultation_id_to_consultations" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_order_order_request_id_to_order_requests" FOREIGN KEY ("order_request_id") REFERENCES "order_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_order_created_by_doctor_id_to_employee" FOREIGN KEY ("created_by_doctor_id") REFERENCES "employee"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medication_schedules" ADD CONSTRAINT "FK_medication_schedules_user_id_to_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medication_schedules" ADD CONSTRAINT "FK_medication_schedules_item_id_to_item" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medication_schedules" ADD CONSTRAINT "FK_medication_schedules_consultation_id_to_consultations" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consultation_messages" ADD CONSTRAINT "FK_consultation_messages_consultation_id_to_consultations" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consultation_messages" ADD CONSTRAINT "FK_consultation_messages_sender_user_id_to_user" FOREIGN KEY ("sender_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consultation_messages" ADD CONSTRAINT "FK_consultation_messages_sender_doctor_id_to_employee" FOREIGN KEY ("sender_doctor_id") REFERENCES "employee"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consultations" ADD CONSTRAINT "FK_consultations_user_id_to_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consultations" ADD CONSTRAINT "FK_consultations_doctor_id_to_employee" FOREIGN KEY ("doctor_id") REFERENCES "employee"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consultations" ADD CONSTRAINT "FK_consultations_branch_id_to_branch" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consultations" ADD CONSTRAINT "FK_consultations_order_request_id_to_order_requests" FOREIGN KEY ("order_request_id") REFERENCES "order_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consultation_queue" ADD CONSTRAINT "FK_consultation_queue_consultation_id_to_consultations" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consultation_queue" ADD CONSTRAINT "FK_consultation_queue_branch_id_to_branch" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consultation_queue" DROP CONSTRAINT "FK_consultation_queue_branch_id_to_branch"`);
        await queryRunner.query(`ALTER TABLE "consultation_queue" DROP CONSTRAINT "FK_consultation_queue_consultation_id_to_consultations"`);
        await queryRunner.query(`ALTER TABLE "consultations" DROP CONSTRAINT "FK_consultations_order_request_id_to_order_requests"`);
        await queryRunner.query(`ALTER TABLE "consultations" DROP CONSTRAINT "FK_consultations_branch_id_to_branch"`);
        await queryRunner.query(`ALTER TABLE "consultations" DROP CONSTRAINT "FK_consultations_doctor_id_to_employee"`);
        await queryRunner.query(`ALTER TABLE "consultations" DROP CONSTRAINT "FK_consultations_user_id_to_user"`);
        await queryRunner.query(`ALTER TABLE "consultation_messages" DROP CONSTRAINT "FK_consultation_messages_sender_doctor_id_to_employee"`);
        await queryRunner.query(`ALTER TABLE "consultation_messages" DROP CONSTRAINT "FK_consultation_messages_sender_user_id_to_user"`);
        await queryRunner.query(`ALTER TABLE "consultation_messages" DROP CONSTRAINT "FK_consultation_messages_consultation_id_to_consultations"`);
        await queryRunner.query(`ALTER TABLE "medication_schedules" DROP CONSTRAINT "FK_medication_schedules_consultation_id_to_consultations"`);
        await queryRunner.query(`ALTER TABLE "medication_schedules" DROP CONSTRAINT "FK_medication_schedules_item_id_to_item"`);
        await queryRunner.query(`ALTER TABLE "medication_schedules" DROP CONSTRAINT "FK_medication_schedules_user_id_to_user"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_order_created_by_doctor_id_to_employee"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_order_order_request_id_to_order_requests"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_order_consultation_id_to_consultations"`);
        await queryRunner.query(`ALTER TABLE "order_requests" DROP CONSTRAINT "FK_order_requests_doctor_id_to_employee"`);
        await queryRunner.query(`ALTER TABLE "order_requests" DROP CONSTRAINT "FK_order_requests_branch_id_to_branch"`);
        await queryRunner.query(`ALTER TABLE "order_requests" DROP CONSTRAINT "FK_order_requests_user_id_to_user"`);
        await queryRunner.query(`ALTER TABLE "order_request_messages" DROP CONSTRAINT "FK_order_request_messages_sender_doctor_id_to_employee"`);
        await queryRunner.query(`ALTER TABLE "order_request_messages" DROP CONSTRAINT "FK_order_request_messages_sender_user_id_to_user"`);
        await queryRunner.query(`ALTER TABLE "order_request_messages" DROP CONSTRAINT "FK_order_request_messages_order_request_id_to_order_requests"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "created_by_doctor_id"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "UQ_e7681af306c54c755d121299b69"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "order_request_id"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "consultation_id"`);
        await queryRunner.query(`ALTER TABLE "order_item" DROP COLUMN "schedule"`);
        await queryRunner.query(`ALTER TABLE "order_item" DROP COLUMN "medication_timing"`);
        await queryRunner.query(`ALTER TABLE "order_item" DROP COLUMN "doctor_instructions"`);
        await queryRunner.query(`ALTER TABLE "employee" DROP COLUMN "total_consultations"`);
        await queryRunner.query(`ALTER TABLE "employee" DROP COLUMN "bio"`);
        await queryRunner.query(`ALTER TABLE "employee" DROP COLUMN "specialties"`);
        await queryRunner.query(`ALTER TABLE "employee" DROP COLUMN "is_visible_to_public"`);
        await queryRunner.query(`ALTER TABLE "employee" DROP COLUMN "max_concurrent_consultations"`);
        await queryRunner.query(`ALTER TABLE "employee" DROP COLUMN "active_consultations_count"`);
        await queryRunner.query(`ALTER TABLE "employee" DROP COLUMN "available_for_consultation"`);
        await queryRunner.query(`ALTER TABLE "employee" DROP COLUMN "image_url"`);
        await queryRunner.query(`DROP TABLE "consultation_queue"`);
        await queryRunner.query(`DROP TABLE "consultations"`);
        await queryRunner.query(`DROP TYPE "public"."consultations_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."consultations_type_enum"`);
        await queryRunner.query(`DROP TABLE "consultation_messages"`);
        await queryRunner.query(`DROP TYPE "public"."consultation_messages_sender_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."consultation_messages_type_enum"`);
        await queryRunner.query(`DROP TABLE "medication_schedules"`);
        await queryRunner.query(`DROP TYPE "public"."medication_schedules_frequency_enum"`);
        await queryRunner.query(`DROP TABLE "order_requests"`);
        await queryRunner.query(`DROP TYPE "public"."order_requests_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."order_requests_type_enum"`);
        await queryRunner.query(`DROP TABLE "order_request_messages"`);
        await queryRunner.query(`DROP TYPE "public"."order_request_messages_sender_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."order_request_messages_type_enum"`);
    }

}
