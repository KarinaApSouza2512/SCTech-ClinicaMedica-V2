import { MigrationInterface, QueryRunner } from 'typeorm';

// Ainda nao ha dados em producao, entao a tabela e recriada no formato da etapa 2
export class RecreateUsersWithRoles1761200000000 implements MigrationInterface {
  name = 'RecreateUsersWithRoles1761200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "name" character varying(120) NOT NULL,
        "email" character varying(160) NOT NULL,
        "password" character varying NOT NULL,
        "roles" text[] NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "CHK_users_roles" CHECK (
          "roles" <@ ARRAY['admin', 'secretary', 'doctor']::text[] AND cardinality("roles") > 0
        )
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('ADMIN', 'ATTENDANT', 'DOCTOR', 'PATIENT')`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "email" character varying(160) NOT NULL,
        "password" character varying NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'ATTENDANT',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
  }
}
