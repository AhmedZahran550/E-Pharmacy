import { MigrationInterface, QueryRunner } from "typeorm";

export class MaxEmployees1766502824498 implements MigrationInterface {
    name = 'MaxEmployees1766502824498'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_governorate_search_vector"`);
        await queryRunner.query(`DROP INDEX "public"."idx_city_search_vector"`);
        await queryRunner.query(`DROP INDEX "public"."idx_provider_search_vector_ar"`);
        await queryRunner.query(`DROP INDEX "public"."idx_provider_search_vector_en"`);
        await queryRunner.query(`DROP INDEX "public"."idx_branch_search_vector_ar"`);
        await queryRunner.query(`DROP INDEX "public"."idx_branch_search_vector_en"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_profile_completed"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`, ["GENERATED_COLUMN","is_profile_completed","pharmacy","public","user"]);
        await queryRunner.query(`ALTER TABLE "branch" ADD "max_employees" integer`);
        await queryRunner.query(`ALTER TYPE "public"."user_roles_enum" RENAME TO "user_roles_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_roles_enum" AS ENUM('anonymous', 'user', 'app_owner', 'app_user', 'app_tester', 'guest', 'provider_doctor', 'provider_user', 'provider_admin', 'system_user', 'system_admin', 'super_admin', 'admin')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" TYPE "public"."user_roles_enum"[] USING "roles"::"text"::"public"."user_roles_enum"[]`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT '{user,app_user}'`);
        await queryRunner.query(`DROP TYPE "public"."user_roles_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."employee_type_enum" RENAME TO "employee_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."employee_type_enum" AS ENUM('system', 'provider')`);
        await queryRunner.query(`ALTER TABLE "employee" ALTER COLUMN "type" TYPE "public"."employee_type_enum" USING "type"::"text"::"public"."employee_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."employee_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."employee_roles_enum" RENAME TO "employee_roles_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."employee_roles_enum" AS ENUM('anonymous', 'user', 'app_owner', 'app_user', 'app_tester', 'guest', 'provider_doctor', 'provider_user', 'provider_admin', 'system_user', 'system_admin', 'super_admin', 'admin')`);
        await queryRunner.query(`ALTER TABLE "employee" ALTER COLUMN "roles" TYPE "public"."employee_roles_enum"[] USING "roles"::"text"::"public"."employee_roles_enum"[]`);
        await queryRunner.query(`DROP TYPE "public"."employee_roles_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."employee_roles_enum_old" AS ENUM('admin', 'anonymous', 'app_owner', 'app_tester', 'app_user', 'guest', 'provider_admin', 'provider_user', 'super_admin', 'system_admin', 'system_user', 'user')`);
        await queryRunner.query(`ALTER TABLE "employee" ALTER COLUMN "roles" TYPE "public"."employee_roles_enum_old"[] USING "roles"::"text"::"public"."employee_roles_enum_old"[]`);
        await queryRunner.query(`DROP TYPE "public"."employee_roles_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."employee_roles_enum_old" RENAME TO "employee_roles_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."employee_type_enum_old" AS ENUM('customer', 'provider', 'system')`);
        await queryRunner.query(`ALTER TABLE "employee" ALTER COLUMN "type" TYPE "public"."employee_type_enum_old" USING "type"::"text"::"public"."employee_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."employee_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."employee_type_enum_old" RENAME TO "employee_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."user_roles_enum_old" AS ENUM('admin', 'anonymous', 'app_owner', 'app_tester', 'app_user', 'guest', 'provider_admin', 'provider_user', 'super_admin', 'system_admin', 'system_user', 'user')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" TYPE "public"."user_roles_enum_old"[] USING "roles"::"text"::"public"."user_roles_enum_old"[]`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT '{user,app_user}'`);
        await queryRunner.query(`DROP TYPE "public"."user_roles_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_roles_enum_old" RENAME TO "user_roles_enum"`);
        await queryRunner.query(`ALTER TABLE "branch" DROP COLUMN "max_employees"`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`, ["pharmacy","public","user","GENERATED_COLUMN","is_profile_completed","\"photo_url\" IS NOT NULL"]);
        await queryRunner.query(`ALTER TABLE "user" ADD "is_profile_completed" boolean GENERATED ALWAYS AS ("photo_url" IS NOT NULL) STORED NOT NULL`);
        await queryRunner.query(`CREATE INDEX "idx_branch_search_vector_en" ON "branch" ("search_vector_en") `);
        await queryRunner.query(`CREATE INDEX "idx_branch_search_vector_ar" ON "branch" ("search_vector_ar") `);
        await queryRunner.query(`CREATE INDEX "idx_provider_search_vector_en" ON "provider" ("search_vector_en") `);
        await queryRunner.query(`CREATE INDEX "idx_provider_search_vector_ar" ON "provider" ("search_vector_ar") `);
        await queryRunner.query(`CREATE INDEX "idx_city_search_vector" ON "city" ("search_vector") `);
        await queryRunner.query(`CREATE INDEX "idx_governorate_search_vector" ON "governorate" ("search_vector") `);
    }

}
