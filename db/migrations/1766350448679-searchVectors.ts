import { MigrationInterface, QueryRunner } from "typeorm";

export class SearchVectors1766350448679 implements MigrationInterface {
    name = 'SearchVectors1766350448679'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_governorate_search_vector"`);
        await queryRunner.query(`DROP INDEX "public"."idx_city_search_vector"`);
        await queryRunner.query(`ALTER TABLE "provider" DROP COLUMN "search_vector"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`, ["GENERATED_COLUMN","search_vector","pharmacy","public","provider"]);
        await queryRunner.query(`ALTER TABLE "branch" DROP COLUMN "search_vector"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`, ["GENERATED_COLUMN","search_vector","pharmacy","public","branch"]);
        await queryRunner.query(`ALTER TABLE "provider" ADD "search_vector_en" tsvector GENERATED ALWAYS AS (to_tsvector('english', COALESCE(name_en, '') || ' ' || COALESCE(address_en, ''))) STORED NOT NULL`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`, ["pharmacy","public","provider","GENERATED_COLUMN","search_vector_en","to_tsvector('english', COALESCE(name_en, '') || ' ' || COALESCE(address_en, ''))"]);
        await queryRunner.query(`ALTER TABLE "provider" ADD "search_vector_ar" tsvector GENERATED ALWAYS AS (to_tsvector('arabic', COALESCE(name_ar, '') || ' ' || COALESCE(address_ar, ''))) STORED NOT NULL`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`, ["pharmacy","public","provider","GENERATED_COLUMN","search_vector_ar","to_tsvector('arabic', COALESCE(name_ar, '') || ' ' || COALESCE(address_ar, ''))"]);
        await queryRunner.query(`ALTER TABLE "branch" ADD "search_vector_en" tsvector GENERATED ALWAYS AS (to_tsvector('english', COALESCE(name_en, '') || ' ' || COALESCE(address_en, ''))) STORED NOT NULL`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`, ["pharmacy","public","branch","GENERATED_COLUMN","search_vector_en","to_tsvector('english', COALESCE(name_en, '') || ' ' || COALESCE(address_en, ''))"]);
        await queryRunner.query(`ALTER TABLE "branch" ADD "search_vector_ar" tsvector GENERATED ALWAYS AS (to_tsvector('arabic', COALESCE(name_ar, '') || ' ' || COALESCE(address_ar, ''))) STORED NOT NULL`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`, ["pharmacy","public","branch","GENERATED_COLUMN","search_vector_ar","to_tsvector('arabic', COALESCE(name_ar, '') || ' ' || COALESCE(address_ar, ''))"]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`, ["GENERATED_COLUMN","search_vector_ar","pharmacy","public","branch"]);
        await queryRunner.query(`ALTER TABLE "branch" DROP COLUMN "search_vector_ar"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`, ["GENERATED_COLUMN","search_vector_en","pharmacy","public","branch"]);
        await queryRunner.query(`ALTER TABLE "branch" DROP COLUMN "search_vector_en"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`, ["GENERATED_COLUMN","search_vector_ar","pharmacy","public","provider"]);
        await queryRunner.query(`ALTER TABLE "provider" DROP COLUMN "search_vector_ar"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`, ["GENERATED_COLUMN","search_vector_en","pharmacy","public","provider"]);
        await queryRunner.query(`ALTER TABLE "provider" DROP COLUMN "search_vector_en"`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`, ["pharmacy","public","branch","GENERATED_COLUMN","search_vector","to_tsvector('english', \n    COALESCE(name_en, '') || ' ' || COALESCE(name_ar, ''))"]);
        await queryRunner.query(`ALTER TABLE "branch" ADD "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('english', 
    COALESCE(name_en, '') || ' ' || COALESCE(name_ar, ''))) STORED NOT NULL`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`, ["pharmacy","public","provider","GENERATED_COLUMN","search_vector","to_tsvector('english', \n    COALESCE(name_en, '') || ' ' || COALESCE(name_ar, ''))"]);
        await queryRunner.query(`ALTER TABLE "provider" ADD "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('english', 
    COALESCE(name_en, '') || ' ' || COALESCE(name_ar, ''))) STORED NOT NULL`);
        await queryRunner.query(`CREATE INDEX "idx_city_search_vector" ON "city" ("search_vector") `);
        await queryRunner.query(`CREATE INDEX "idx_governorate_search_vector" ON "governorate" ("search_vector") `);
    }

}
