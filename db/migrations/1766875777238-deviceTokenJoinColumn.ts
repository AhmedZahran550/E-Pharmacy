import { MigrationInterface, QueryRunner } from "typeorm";

export class DeviceTokenJoinColumn1766875777238 implements MigrationInterface {
    name = 'DeviceTokenJoinColumn1766875777238'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_request_messages" DROP CONSTRAINT "FK_service_request_messages_service_request_id_to_service_reque"`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" ADD CONSTRAINT "FK_service_request_messages_service_request_id_to_service_requests" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_request_messages" DROP CONSTRAINT "FK_service_request_messages_service_request_id_to_service_requests"`);
        await queryRunner.query(`ALTER TABLE "service_request_messages" ADD CONSTRAINT "FK_service_request_messages_service_request_id_to_service_reque" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
