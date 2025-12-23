import { MigrationInterface, QueryRunner } from "typeorm";

export class BranchRating1766528728561 implements MigrationInterface {
    name = 'BranchRating1766528728561'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "branch_rating" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" numeric(3,2) NOT NULL, "notes" text, "user_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" character varying, "deleted_by" character varying, "version" integer, CONSTRAINT "PK_branch_rating_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "BRANCH_RATING_USER_BRANCH_UNIQUE_IDX" ON "branch_rating" ("user_id", "branch_id") `);
        await queryRunner.query(`ALTER TABLE "branch_rating" ADD CONSTRAINT "FK_branch_rating_user_id_to_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branch_rating" ADD CONSTRAINT "FK_branch_rating_branch_id_to_branch" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "branch_rating" DROP CONSTRAINT "FK_branch_rating_branch_id_to_branch"`);
        await queryRunner.query(`ALTER TABLE "branch_rating" DROP CONSTRAINT "FK_branch_rating_user_id_to_user"`);
        await queryRunner.query(`DROP INDEX "public"."BRANCH_RATING_USER_BRANCH_UNIQUE_IDX"`);
        await queryRunner.query(`DROP TABLE "branch_rating"`);
    }

}
