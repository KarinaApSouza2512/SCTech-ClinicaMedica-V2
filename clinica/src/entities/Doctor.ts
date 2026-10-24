import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './User';

@Entity('doctors')
@Unique('UQ_doctors_crm', ['crm'])
@Unique('UQ_doctors_user_id', ['userId'])
export class Doctor {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_doctors_id' })
  id!: number;

  @Column({ type: 'varchar', length: 30 })
  crm!: string;

  @Column({ name: 'user_id', type: 'integer' })
  userId!: number;

  // Usuario de acesso do medico, criado na mesma transacao
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_doctors_user_id' })
  user!: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
