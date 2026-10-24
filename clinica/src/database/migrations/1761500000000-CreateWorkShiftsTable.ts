import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkShiftsTable1761500000000 implements MigrationInterface {
  name = 'CreateWorkShiftsTable1761500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "work_shifts" (
        "id" SERIAL NOT NULL,
        "doctor_id" integer NOT NULL,
        "week_day" smallint NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "slot_duration_minutes" integer NOT NULL,
        CONSTRAINT "PK_work_shifts_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_work_shifts_week_day" CHECK ("week_day" BETWEEN 0 AND 6),
        CONSTRAINT "CHK_work_shifts_time_range" CHECK ("start_time" < "end_time"),
        CONSTRAINT "CHK_work_shifts_slot_duration" CHECK ("slot_duration_minutes" > 0),
        CONSTRAINT "FK_work_shifts_doctor_id" FOREIGN KEY ("doctor_id")
          REFERENCES "doctors" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_work_shifts_doctor_id" ON "work_shifts" ("doctor_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_work_shifts_doctor_id"`);
    await queryRunner.query(`DROP TABLE "work_shifts"`);
  }
}
