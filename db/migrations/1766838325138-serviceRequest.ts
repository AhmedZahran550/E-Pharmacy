import { MigrationInterface, QueryRunner } from "typeorm";

export class ServiceRequest1766838325138 implements MigrationInterface {
    name = 'ServiceRequest1766838325138'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consultations" DROP CONSTRAINT "FK_consultations_order_request_id_to_order_requests"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_order_order_request_id_to_order_requests"`);
        await queryRunner.query(`ALTER TABLE "consultations" RENAME COLUMN "order_request_id" TO "service_request_id"`);
        await queryRunner.query(`ALTER TABLE "order" RENAME COLUMN "order_request_id" TO "service_request_id"`);
        await queryRunner.query(`ALTER TABLE "order" RENAME CONSTRAINT "UQ_e7681af306c54c755d121299b69" TO "UQ_2e35d55faaf26a6b83a417bada3"`);
        await queryRunner.query(`CREATE TYPE "public"."service_request_messages_type_enum" AS ENUM('TEXT', 'IMAGE', 'DOCUMENT', 'SYSTEM')`);
        await queryRunner.query(`CREATE TYPE "public"."service_request_messages_sender_role_enum" AS ENUM('USER', 'DOCTOR', 'SYSTEM')`);
        await queryRunner.query(`CREATE TABLE "service_request_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."service_request_messages_type_enum" NOT NULL, "sender_role" "public"."service_request_messages_sender_role_enum" NOT NULL, "content" text NOT NULL, "message_metadata" jsonb, "is_read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP, "service_request_id" uuid NOT NULL, "sender_user_id" uuid, "sender_doctor_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" character varying, "deleted_by" character varying, "version" integer, CONSTRAINT "PK_service_request_messages_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."service_requests_type_enum" AS ENUM('PRESCRIPTION_IMAGE', 'ITEM_SELECTION', 'MANUAL_ENTRY', 'MIXED')`);
        await queryRunner.query(`CREATE TYPE "public"."service_requests_status_enum" AS ENUM('PENDING', 'REVIEWING', 'CLARIFICATION_NEEDED', 'COMPLETED', 'CANCELLED', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "service_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "request_no" character varying(20) NOT NULL, "type" "public"."service_requests_type_enum" NOT NULL, "status" "public"."service_requests_status_enum" NOT NULL DEFAULT 'PENDING', "prescription_images" jsonb, "selected_items" jsonb, "manual_items" jsonb, "notes" text, "assigned_at" TIMESTAMP, "reviewed_at" TIMESTAMP, "completed_at" TIMESTAMP, "expires_at" TIMESTAMP, "doctor_notes" text, "user_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "doctor_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" character varying, "deleted_by" character varying, "version" integer, CONSTRAINT "UQ_a5c22c0f5e3fb9a3e3f8cf57e37" UNIQUE ("request_no"), CONSTRAINT "PK_service_requests_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "device_token" ADD "employee_id" uuid`);
        await queryRunner.query(`ALTER TABLE "device_token" ADD "employee_id" uuid`);
        await queryRunner.query(`ALTER TYPE "public"."notification_type_enum" RENAME TO "notification_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('SUBSCRIPTION_RENEWAL', 'SUBSCRIPTION_EXPIRATION', 'SUBSCRIPTION_CONFIRMED', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_EXPIRATION_WARNING', 'SUBSCRIPTION_EXPIRED', 'PROMO_CODE_EXPIRY', 'PAYMENT_PENDING', 'PENDING_PAYMENT', 'PAYMENT_SUCCESS', 'PAYMENT_FAILURE', 'PAYMENT_FOR_OTHERS_REQUEST', 'PAYMENT_FOR_OTHERS_REJECTED', 'PAYMENT_FOR_OTHERS_FAILED', 'PAYMENT_FOR_OTHERS_SUCCESS', 'NEW_ORDER', 'ORDER_REJECTED', 'ORDER_CANCELED', 'ORDER_REOPENED', 'ORDER_ACCEPTED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_RETURNED', 'ORDER_PICKED_UP', 'ORDER_PREPARING', 'NEW_SERVICE_REQUEST', 'NEW_OFFER', 'PERSONALIZED_OFFER', 'OFFER_EXPIRY_REMINDER', 'SPECIAL_OFFER', 'SERVICE_AVAILABILITY', 'NEW_ITEM_AVAILABLE', 'POINTS_EARNED', 'POINTS_REDEEMED', 'POINTS_EXPIRY_WARNING', 'POINTS_MANUALLY_ADDED', 'POINTS_EXPIRATION_WARNING', 'POINTS_EXPIRED', 'REFERRAL_REWARD', 'PROVIDER_NEW', 'BRANCH_NEW', 'BALANCE_UPDATED', 'ACCOUNT_VERIFIED', 'ACCOUNT_VERIFICATION_FAILED', 'NEW_DEVICE_LOGIN', 'PASSWORD_CHANGED', 'PASSWORD_CHANGE_FAILED', 'FEATURE_ANNOUNCEMENT', 'APP_UPDATE_AVAILABLE', 'MAINTENANCE_NOTIFICATION', 'SURVEY_REQUEST', 'NEW_SUPPORT_TICKET', 'SUPPORT_TICKET_ESCALATED', 'SUPPORT_TICKET_RESOLVED', 'SUPPORT_TICKET_MESSAGE')`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum" USING "type"::"text"::"public"."notification_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."system_notification_type_enum" RENAME TO "system_notification_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."system_notification_type_enum" AS ENUM('NEW_ORDER', 'CANCELED', 'ORDER_REJECTED', 'ORDER_CANCELED', 'ORDER_REOPENED', 'NEW_SERVICE_REQUEST', 'NEW_SUPPORT_TICKET', 'NEW_ESCALATED_SUPPORT_TICKET')`);
        await queryRunner.query(`ALTER TABLE "system_notification" ALTER COLUMN "type" TYPE "public"."system_notification_type_enum" USING "type"::"text"::"public"."system_notification_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."system_notification_type_enum_old"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "DEVICE_TOKEN_EMPLOYEE_IDX" ON "device_token" ("employee_id", "device_token") WHERE "employee_id" IS NOT NULL`);
        await queryRunner.query(`ALTER TABLE "device_token" ADD CONSTRAINT "CHK_USER_OR_EMPLOYEE" CHECK (("user_id" IS NOT NULL AND "employee_id" IS NULL) OR ("user_id" IS NULL AND "employee_id" IS NOT NULL))`);
        await queryRunner.query(`ALTER TABLE "consultations" ADD CONSTRAINT "FK_consultations_service_request_id_to_service_requests" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_order_service_request_id_to_service_requests" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "device_token" ADD CONSTRAINT "FK_device_token_employee_id_to_employee" FOREIGN KEY ("employee_id") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" ADD CONSTRAINT "FK_service_request_messages_service_request_id_to_service_requests" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" ADD CONSTRAINT "FK_service_request_messages_sender_user_id_to_user" FOREIGN KEY ("sender_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" ADD CONSTRAINT "FK_service_request_messages_sender_doctor_id_to_employee" FOREIGN KEY ("sender_doctor_id") REFERENCES "employee"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_service_requests_user_id_to_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_service_requests_branch_id_to_branch" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_service_requests_doctor_id_to_employee" FOREIGN KEY ("doctor_id") REFERENCES "employee"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_service_requests_doctor_id_to_employee"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_service_requests_branch_id_to_branch"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_service_requests_user_id_to_user"`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" DROP CONSTRAINT "FK_service_request_messages_sender_doctor_id_to_employee"`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" DROP CONSTRAINT "FK_service_request_messages_sender_user_id_to_user"`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" DROP CONSTRAINT "FK_service_request_messages_service_request_id_to_service_requests"`);
        await queryRunner.query(`ALTER TABLE "device_token" DROP CONSTRAINT "FK_device_token_employee_id_to_employee"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_order_service_request_id_to_service_requests"`);
        await queryRunner.query(`ALTER TABLE "consultations" DROP CONSTRAINT "FK_consultations_service_request_id_to_service_requests"`);
        await queryRunner.query(`ALTER TABLE "device_token" DROP CONSTRAINT "CHK_USER_OR_EMPLOYEE"`);
        await queryRunner.query(`DROP INDEX "public"."DEVICE_TOKEN_EMPLOYEE_IDX"`);
        await queryRunner.query(`CREATE TYPE "public"."system_notification_type_enum_old" AS ENUM('CANCELED', 'NEW_ESCALATED_SUPPORT_TICKET', 'NEW_ORDER', 'NEW_SUPPORT_TICKET', 'ORDER_CANCELED', 'ORDER_REJECTED', 'ORDER_REOPENED')`);
        await queryRunner.query(`ALTER TABLE "system_notification" ALTER COLUMN "type" TYPE "public"."system_notification_type_enum_old" USING "type"::"text"::"public"."system_notification_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."system_notification_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."system_notification_type_enum_old" RENAME TO "system_notification_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum_old" AS ENUM('ACCOUNT_VERIFICATION_FAILED', 'ACCOUNT_VERIFIED', 'APP_UPDATE_AVAILABLE', 'BALANCE_UPDATED', 'BRANCH_NEW', 'FEATURE_ANNOUNCEMENT', 'MAINTENANCE_NOTIFICATION', 'NEW_DEVICE_LOGIN', 'NEW_ITEM_AVAILABLE', 'NEW_OFFER', 'NEW_ORDER', 'NEW_SUPPORT_TICKET', 'OFFER_EXPIRY_REMINDER', 'ORDER_ACCEPTED', 'ORDER_CANCELED', 'ORDER_DELIVERED', 'ORDER_PICKED_UP', 'ORDER_PREPARING', 'ORDER_REJECTED', 'ORDER_REOPENED', 'ORDER_RETURNED', 'ORDER_SHIPPED', 'PASSWORD_CHANGED', 'PASSWORD_CHANGE_FAILED', 'PAYMENT_FAILURE', 'PAYMENT_FOR_OTHERS_FAILED', 'PAYMENT_FOR_OTHERS_REJECTED', 'PAYMENT_FOR_OTHERS_REQUEST', 'PAYMENT_FOR_OTHERS_SUCCESS', 'PAYMENT_PENDING', 'PAYMENT_SUCCESS', 'PENDING_PAYMENT', 'PERSONALIZED_OFFER', 'POINTS_EARNED', 'POINTS_EXPIRATION_WARNING', 'POINTS_EXPIRED', 'POINTS_EXPIRY_WARNING', 'POINTS_MANUALLY_ADDED', 'POINTS_REDEEMED', 'PROMO_CODE_EXPIRY', 'PROVIDER_NEW', 'REFERRAL_REWARD', 'SERVICE_AVAILABILITY', 'SPECIAL_OFFER', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_CONFIRMED', 'SUBSCRIPTION_EXPIRATION', 'SUBSCRIPTION_EXPIRATION_WARNING', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_RENEWAL', 'SUPPORT_TICKET_ESCALATED', 'SUPPORT_TICKET_MESSAGE', 'SUPPORT_TICKET_RESOLVED', 'SURVEY_REQUEST')`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum_old" USING "type"::"text"::"public"."notification_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notification_type_enum_old" RENAME TO "notification_type_enum"`);
        await queryRunner.query(`ALTER TABLE "device_token" DROP COLUMN "employee_id"`);
        await queryRunner.query(`ALTER TABLE "device_token" DROP COLUMN "employee_id"`);
        await queryRunner.query(`DROP TABLE "service_requests"`);
        await queryRunner.query(`DROP TYPE "public"."service_requests_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."service_requests_type_enum"`);
        await queryRunner.query(`DROP TABLE "service_request_messages"`);
        await queryRunner.query(`DROP TYPE "public"."service_request_messages_sender_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."service_request_messages_type_enum"`);
        await queryRunner.query(`ALTER TABLE "order" RENAME CONSTRAINT "UQ_2e35d55faaf26a6b83a417bada3" TO "UQ_e7681af306c54c755d121299b69"`);
        await queryRunner.query(`ALTER TABLE "order" RENAME COLUMN "service_request_id" TO "order_request_id"`);
        await queryRunner.query(`ALTER TABLE "consultations" RENAME COLUMN "service_request_id" TO "order_request_id"`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_order_order_request_id_to_order_requests" FOREIGN KEY ("order_request_id") REFERENCES "order_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consultations" ADD CONSTRAINT "FK_consultations_order_request_id_to_order_requests" FOREIGN KEY ("order_request_id") REFERENCES "order_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
