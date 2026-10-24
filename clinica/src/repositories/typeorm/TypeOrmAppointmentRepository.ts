import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Appointment } from '../../entities/Appointment';
import { Doctor } from '../../entities/Doctor';
import { Patient } from '../../entities/Patient';
import { AppointmentStatus } from '../../enums/AppointmentStatus';
import {
  IAppointmentRepository,
  IAppointmentTransaction,
  NewAppointmentData,
} from '../ports/IAppointmentRepository';

type OverlapColumn = 'doctorId' | 'patientId';

// Usa somente o manager recebido: fora dele a consulta sairia da transacao
class TypeOrmAppointmentTransaction implements IAppointmentTransaction {
  constructor(private readonly manager: EntityManager) {}

  async lockPatient(patientId: number): Promise<void> {
    await this.manager
      .getRepository(Patient)
      .createQueryBuilder('patient')
      .setLock('pessimistic_write')
      .where('patient.id = :patientId', { patientId })
      .getOne();
  }

  hasDoctorOverlap(doctorId: number, start: Date, end: Date): Promise<boolean> {
    return this.hasOverlap('doctorId', doctorId, start, end);
  }

  hasPatientOverlap(patientId: number, start: Date, end: Date): Promise<boolean> {
    return this.hasOverlap('patientId', patientId, start, end);
  }

  create(data: NewAppointmentData): Promise<Appointment> {
    const repository = this.manager.getRepository(Appointment);
    return repository.save(repository.create(data));
  }

  // Mesma condicao de periodsOverlap: a.inicio < b.fim e b.inicio < a.fim
  private hasOverlap(column: OverlapColumn, id: number, start: Date, end: Date): Promise<boolean> {
    return this.manager
      .getRepository(Appointment)
      .createQueryBuilder('appointment')
      .where(`appointment.${column} = :id`, { id })
      .andWhere('appointment.status <> :cancelled', { cancelled: AppointmentStatus.CANCELLED })
      .andWhere('appointment.startsAt < :end', { end })
      .andWhere('appointment.endsAt > :start', { start })
      .getExists();
  }
}

@Injectable()
export class TypeOrmAppointmentRepository implements IAppointmentRepository {
  constructor(private readonly dataSource: DataSource) {}

  withDoctorLock<T>(
    doctorId: number,
    work: (tx: IAppointmentTransaction) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      // Trava a linha do medico, e nao as consultas: FOR UPDATE so trava linhas que existem,
      // e numa agenda vazia nao haveria consulta para travar. Com o medico travado, duas
      // requisicoes para ele passam pela verificacao uma de cada vez.
      await manager
        .getRepository(Doctor)
        .createQueryBuilder('doctor')
        .setLock('pessimistic_write')
        .where('doctor.id = :doctorId', { doctorId })
        .getOne();

      return work(new TypeOrmAppointmentTransaction(manager));
    });
  }
}
