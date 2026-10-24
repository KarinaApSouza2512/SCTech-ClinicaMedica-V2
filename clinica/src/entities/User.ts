import { Check, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Role } from '../enums/Role';

@Entity('users')
@Unique('UQ_users_email', ['email'])
@Check(
  'CHK_users_roles',
  `"roles" <@ ARRAY['admin', 'secretary', 'doctor']::text[] AND cardinality("roles") > 0`,
)
export class User {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_users_id' })
  id!: number;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 160 })
  email!: string;

  @Column({ type: 'varchar', select: false })
  password!: string;

  @Column({ type: 'text', array: true })
  roles!: Role[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
