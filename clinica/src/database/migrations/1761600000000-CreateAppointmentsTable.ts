import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppointmentsTable1761600000000 implements MigrationInterface {
  name = 'CreateAppointmentsTable1761600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" SERIAL NOT NULL,
        "doctor_id" integer NOT NULL,
        "patient_id" integer NOT NULL,
        "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'scheduled',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_appointments_status"
          CHECK ("status" IN ('scheduled', 'in_progress', 'done', 'cancelled')),
        CONSTRAINT "CHK_appointments_period" CHECK ("starts_at" < "ends_at"),
        CONSTRAINT "FK_appointments_doctor_id" FOREIGN KEY ("doctor_id")
          REFERENCES "doctors" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_appointments_patient_id" FOREIGN KEY ("patient_id")
          REFERENCES "patients" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    // Os conflitos sao buscados por medico ou paciente dentro de um periodo
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_doctor_id_starts_at" ON "appointments" ("doctor_id", "starts_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_patient_id_starts_at" ON "appointments" ("patient_id", "starts_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_appointments_patient_id_starts_at"`);
    await queryRunner.query(`DROP INDEX "IDX_appointments_doctor_id_starts_at"`);
    await queryRunner.query(`DROP TABLE "appointments"`);
  }
}
