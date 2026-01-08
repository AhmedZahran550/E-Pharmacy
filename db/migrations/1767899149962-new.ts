import { MigrationInterface, QueryRunner } from "typeorm";

export class New1767899149962 implements MigrationInterface {
    name = 'New1767899149962'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_request_messages" DROP CONSTRAINT "FK_service_request_messages_service_request_id_to_service_reque"`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "cancellation_reason" text`);
        await queryRunner.query(`ALTER TYPE "public"."service_requests_status_enum" RENAME TO "service_requests_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."service_requests_status_enum" AS ENUM('PENDING', 'REVIEWING', 'CLARIFICATION_NEEDED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED')`);
        await queryRunner.query(`ALTER TABLE "service_requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "service_requests" ALTER COLUMN "status" TYPE "public"."service_requests_status_enum" USING "status"::"text"::"public"."service_requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "service_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."service_requests_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."notification_type_enum" RENAME TO "notification_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('SUBSCRIPTION_RENEWAL', 'SUBSCRIPTION_EXPIRATION', 'SUBSCRIPTION_CONFIRMED', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_EXPIRATION_WARNING', 'SUBSCRIPTION_EXPIRED', 'PROMO_CODE_EXPIRY', 'PAYMENT_PENDING', 'PENDING_PAYMENT', 'PAYMENT_SUCCESS', 'PAYMENT_FAILURE', 'PAYMENT_FOR_OTHERS_REQUEST', 'PAYMENT_FOR_OTHERS_REJECTED', 'PAYMENT_FOR_OTHERS_FAILED', 'PAYMENT_FOR_OTHERS_SUCCESS', 'NEW_ORDER', 'ORDER_REJECTED', 'ORDER_CANCELED', 'ORDER_REOPENED', 'ORDER_ACCEPTED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_RETURNED', 'ORDER_PICKED_UP', 'ORDER_PREPARING', 'NEW_SERVICE_REQUEST', 'SERVICE_REQUEST_UPDATE', 'NEW_OFFER', 'PERSONALIZED_OFFER', 'OFFER_EXPIRY_REMINDER', 'SPECIAL_OFFER', 'SERVICE_AVAILABILITY', 'NEW_ITEM_AVAILABLE', 'POINTS_EARNED', 'POINTS_REDEEMED', 'POINTS_EXPIRY_WARNING', 'POINTS_MANUALLY_ADDED', 'POINTS_EXPIRATION_WARNING', 'POINTS_EXPIRED', 'REFERRAL_REWARD', 'PROVIDER_NEW', 'BRANCH_NEW', 'BALANCE_UPDATED', 'ACCOUNT_VERIFIED', 'ACCOUNT_VERIFICATION_FAILED', 'NEW_DEVICE_LOGIN', 'PASSWORD_CHANGED', 'PASSWORD_CHANGE_FAILED', 'FEATURE_ANNOUNCEMENT', 'APP_UPDATE_AVAILABLE', 'MAINTENANCE_NOTIFICATION', 'SURVEY_REQUEST', 'NEW_SUPPORT_TICKET', 'SUPPORT_TICKET_ESCALATED', 'SUPPORT_TICKET_RESOLVED', 'SUPPORT_TICKET_MESSAGE', 'NEW_MESSAGE', 'SERVICE_REQUEST_ACCEPTED', 'SERVICE_REQUEST_REJECTED')`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum" USING "type"::"text"::"public"."notification_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" ADD CONSTRAINT "FK_service_request_messages_service_request_id_to_service_requests" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_request_messages" DROP CONSTRAINT "FK_service_request_messages_service_request_id_to_service_requests"`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum_old" AS ENUM('SUBSCRIPTION_RENEWAL', 'SUBSCRIPTION_EXPIRATION', 'SUBSCRIPTION_CONFIRMED', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_EXPIRATION_WARNING', 'SUBSCRIPTION_EXPIRED', 'PROMO_CODE_EXPIRY', 'PAYMENT_PENDING', 'PENDING_PAYMENT', 'PAYMENT_SUCCESS', 'PAYMENT_FAILURE', 'PAYMENT_FOR_OTHERS_REQUEST', 'PAYMENT_FOR_OTHERS_REJECTED', 'PAYMENT_FOR_OTHERS_FAILED', 'PAYMENT_FOR_OTHERS_SUCCESS', 'NEW_ORDER', 'ORDER_REJECTED', 'ORDER_CANCELED', 'ORDER_REOPENED', 'ORDER_ACCEPTED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_RETURNED', 'ORDER_PICKED_UP', 'ORDER_PREPARING', 'NEW_SERVICE_REQUEST', 'SERVICE_REQUEST_UPDATE', 'NEW_OFFER', 'PERSONALIZED_OFFER', 'OFFER_EXPIRY_REMINDER', 'SPECIAL_OFFER', 'SERVICE_AVAILABILITY', 'NEW_ITEM_AVAILABLE', 'POINTS_EARNED', 'POINTS_REDEEMED', 'POINTS_EXPIRY_WARNING', 'POINTS_MANUALLY_ADDED', 'POINTS_EXPIRATION_WARNING', 'POINTS_EXPIRED', 'REFERRAL_REWARD', 'PROVIDER_NEW', 'BRANCH_NEW', 'BALANCE_UPDATED', 'ACCOUNT_VERIFIED', 'ACCOUNT_VERIFICATION_FAILED', 'NEW_DEVICE_LOGIN', 'PASSWORD_CHANGED', 'PASSWORD_CHANGE_FAILED', 'FEATURE_ANNOUNCEMENT', 'APP_UPDATE_AVAILABLE', 'MAINTENANCE_NOTIFICATION', 'SURVEY_REQUEST', 'NEW_SUPPORT_TICKET', 'SUPPORT_TICKET_ESCALATED', 'SUPPORT_TICKET_RESOLVED', 'SUPPORT_TICKET_MESSAGE', 'NEW_MESSAGE')`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum_old" USING "type"::"text"::"public"."notification_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notification_type_enum_old" RENAME TO "notification_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."service_requests_status_enum_old" AS ENUM('PENDING', 'REVIEWING', 'CLARIFICATION_NEEDED', 'COMPLETED', 'CANCELLED', 'EXPIRED')`);
        await queryRunner.query(`ALTER TABLE "service_requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "service_requests" ALTER COLUMN "status" TYPE "public"."service_requests_status_enum_old" USING "status"::"text"::"public"."service_requests_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "service_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."service_requests_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."service_requests_status_enum_old" RENAME TO "service_requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "cancellation_reason"`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" ADD CONSTRAINT "FK_service_request_messages_service_request_id_to_service_reque" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
