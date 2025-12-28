import { MigrationInterface, QueryRunner } from "typeorm";

export class ServiceRequestType1766875033518 implements MigrationInterface {
    name = 'ServiceRequestType1766875033518'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_request_messages" DROP CONSTRAINT "FK_service_request_messages_service_request_id_to_service_reque"`);
        await queryRunner.query(`ALTER TYPE "public"."service_requests_type_enum" RENAME TO "service_requests_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."service_requests_type_enum" AS ENUM('DELEVARY_ORDER', 'PICKUP_ORDER', 'HOME_VISIT')`);
        await queryRunner.query(`ALTER TABLE "service_requests" ALTER COLUMN "type" TYPE "public"."service_requests_type_enum" USING "type"::"text"::"public"."service_requests_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."service_requests_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" ADD CONSTRAINT "FK_service_request_messages_service_request_id_to_service_requests" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_request_messages" DROP CONSTRAINT "FK_service_request_messages_service_request_id_to_service_requests"`);
        await queryRunner.query(`CREATE TYPE "public"."service_requests_type_enum_old" AS ENUM('ITEM_SELECTION', 'MANUAL_ENTRY', 'MIXED', 'PRESCRIPTION_IMAGE')`);
        await queryRunner.query(`ALTER TABLE "service_requests" ALTER COLUMN "type" TYPE "public"."service_requests_type_enum_old" USING "type"::"text"::"public"."service_requests_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."service_requests_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."service_requests_type_enum_old" RENAME TO "service_requests_type_enum"`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" ADD CONSTRAINT "FK_service_request_messages_service_request_id_to_service_reque" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
