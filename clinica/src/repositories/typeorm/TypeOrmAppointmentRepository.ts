import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Appointment } from '../../entities/Appointment';
import { IAppointmentRepository, NewAppointmentData } from '../ports/IAppointmentRepository';

@Injectable()
export class TypeOrmAppointmentRepository implements IAppointmentRepository {
  private readonly repository: Repository<Appointment>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Appointment);
  }

  create(data: NewAppointmentData): Promise<Appointment> {
    return this.repository.save(this.repository.create(data));
  }
}
