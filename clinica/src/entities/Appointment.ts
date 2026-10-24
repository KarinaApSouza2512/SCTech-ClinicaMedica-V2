import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AppointmentStatus } from '../enums/AppointmentStatus';
import { Doctor } from './Doctor';
import { Patient } from './Patient';

@Entity('appointments')
@Index('IDX_appointments_doctor_id_starts_at', ['doctorId', 'startsAt'])
@Index('IDX_appointments_patient_id_starts_at', ['patientId', 'startsAt'])
@Check(
  'CHK_appointments_status',
  `"status" IN ('scheduled', 'in_progress', 'done', 'cancelled')`,
)
@Check('CHK_appointments_period', '"starts_at" < "ends_at"')
export class Appointment {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_appointments_id' })
  id!: number;

  @Column({ name: 'doctor_id', type: 'integer' })
  doctorId!: number;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_id', foreignKeyConstraintName: 'FK_appointments_doctor_id' })
  doctor!: Doctor;

  @Column({ name: 'patient_id', type: 'integer' })
  patientId!: number;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id', foreignKeyConstraintName: 'FK_appointments_patient_id' })
  patient!: Patient;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt!: Date;

  // Gravado no agendamento: mudar a escala depois nao altera a consulta (RN15)
  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt!: Date;

  @Column({ type: 'varchar', length: 20, default: AppointmentStatus.SCHEDULED })
  status!: AppointmentStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
