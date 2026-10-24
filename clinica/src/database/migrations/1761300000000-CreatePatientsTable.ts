import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePatientsTable1761300000000 implements MigrationInterface {
  name = 'CreatePatientsTable1761300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "patients" (
        "id" SERIAL NOT NULL,
        "name" character varying(120) NOT NULL,
        "cpf" character(11) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_patients_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_patients_cpf" UNIQUE ("cpf")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "patients"`);
  }
}
