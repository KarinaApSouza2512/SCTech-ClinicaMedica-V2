import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDoctorAndPatientRoles1757200100000 implements MigrationInterface {
  name = 'AddDoctorAndPatientRoles1757200100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'DOCTOR'`);
    await queryRunner.query(`ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'PATIENT'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres nao remove valores de enum; recria o tipo apenas com os valores originais.
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
    await queryRunner.query(`ALTER TYPE "users_role_enum" RENAME TO "users_role_enum_old"`);
    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('ADMIN', 'ATTENDANT')`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "users_role_enum" USING "role"::text::"users_role_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'ATTENDANT'`);
    await queryRunner.query(`DROP TYPE "users_role_enum_old"`);
  }
}
