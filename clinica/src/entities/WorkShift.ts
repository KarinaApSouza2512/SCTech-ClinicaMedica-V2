import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Doctor } from './Doctor';

// Um turno da escala semanal; o horario e hora local da clinica, sem data e sem fuso
@Entity('work_shifts')
@Check('CHK_work_shifts_week_day', '"week_day" BETWEEN 0 AND 6')
@Check('CHK_work_shifts_time_range', '"start_time" < "end_time"')
@Check('CHK_work_shifts_slot_duration', '"slot_duration_minutes" > 0')
export class WorkShift {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_work_shifts_id' })
  id!: number;

  @Index('IDX_work_shifts_doctor_id')
  @Column({ name: 'doctor_id', type: 'integer' })
  doctorId!: number;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id', foreignKeyConstraintName: 'FK_work_shifts_doctor_id' })
  doctor!: Doctor;

  // 0 = domingo, como Date.getDay()
  @Column({ name: 'week_day', type: 'smallint' })
  weekDay!: number;

  // O Postgres devolve "HH:MM:SS"
  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({ name: 'slot_duration_minutes', type: 'integer' })
  slotDurationMinutes!: number;
}
