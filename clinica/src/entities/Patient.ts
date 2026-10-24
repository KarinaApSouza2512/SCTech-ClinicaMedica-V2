import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('patients')
@Unique('UQ_patients_cpf', ['cpf'])
export class Patient {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_patients_id' })
  id!: number;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  // Somente os 11 digitos, sem pontuacao
  @Column({ type: 'char', length: 11 })
  cpf!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // Remocao logica: preenchido no DELETE, ignorado pelas consultas do TypeORM
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
