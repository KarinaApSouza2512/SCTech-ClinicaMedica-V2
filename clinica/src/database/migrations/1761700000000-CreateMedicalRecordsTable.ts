import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMedicalRecordsTable1761700000000 implements MigrationInterface {
  name = 'CreateMedicalRecordsTable1761700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "medical_records" (
        "id" SERIAL NOT NULL,
        "patient_id" integer NOT NULL,
        "doctor_id" integer NOT NULL,
        "text" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_medical_records_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_medical_records_patient_id" FOREIGN KEY ("patient_id")
          REFERENCES "patients" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_medical_records_doctor_id" FOREIGN KEY ("doctor_id")
          REFERENCES "doctors" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    // A leitura e sempre do prontuario de um paciente, do mais recente para o mais antigo
    await queryRunner.query(
      `CREATE INDEX "IDX_medical_records_patient_id_created_at" ON "medical_records" ("patient_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_medical_records_patient_id_created_at"`);
    await queryRunner.query(`DROP TABLE "medical_records"`);
  }
}
