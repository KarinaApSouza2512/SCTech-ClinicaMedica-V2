import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Appointment } from '../../entities/Appointment';
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

  inTransaction<T>(work: (tx: IAppointmentTransaction) => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work(new TypeOrmAppointmentTransaction(manager)),
    );
  }
}
