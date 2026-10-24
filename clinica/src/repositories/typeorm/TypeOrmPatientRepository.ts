import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Patient } from '../../entities/Patient';
import { IPatientRepository, NewPatientData } from '../ports/IPatientRepository';

@Injectable()
export class TypeOrmPatientRepository implements IPatientRepository {
  private readonly repository: Repository<Patient>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Patient);
  }

  findByCpf(cpf: string): Promise<Patient | null> {
    return this.repository.findOne({ where: { cpf }, withDeleted: true });
  }

  create(data: NewPatientData): Promise<Patient> {
    return this.repository.save(this.repository.create(data));
  }
}
