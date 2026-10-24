import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Doctor } from './Doctor';
import { Patient } from './Patient';

// Registro de texto do prontuario; o autor e sempre o medico autenticado (RF09)
@Entity('medical_records')
@Index('IDX_medical_records_patient_id_created_at', ['patientId', 'createdAt'])
export class MedicalRecord {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_medical_records_id' })
  id!: number;

  @Column({ name: 'patient_id', type: 'integer' })
  patientId!: number;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id', foreignKeyConstraintName: 'FK_medical_records_patient_id' })
  patient!: Patient;

  @Column({ name: 'doctor_id', type: 'integer' })
  doctorId!: number;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_id', foreignKeyConstraintName: 'FK_medical_records_doctor_id' })
  doctor!: Doctor;

  @Column({ type: 'text' })
  text!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
