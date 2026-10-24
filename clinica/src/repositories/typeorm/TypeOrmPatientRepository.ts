import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Patient } from '../../entities/Patient';
import { pageOffset } from '../../utils/pagination';
import { IPatientRepository, NewPatientData, PatientFilter } from '../ports/IPatientRepository';
import { escapeLike } from './escapeLike';

@Injectable()
export class TypeOrmPatientRepository implements IPatientRepository {
  private readonly repository: Repository<Patient>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Patient);
  }

  findById(id: number): Promise<Patient | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByCpf(cpf: string): Promise<Patient | null> {
    return this.repository.findOne({ where: { cpf }, withDeleted: true });
  }

  findPage(filter: PatientFilter): Promise<[Patient[], number]> {
    const query = this.repository
      .createQueryBuilder('patient')
      .orderBy('patient.id', 'ASC')
      .skip(pageOffset(filter))
      .take(filter.pageSize);

    if (filter.name) {
      query.where('patient.name ILIKE :name', { name: `%${escapeLike(filter.name)}%` });
    }

    return query.getManyAndCount();
  }

  create(data: NewPatientData): Promise<Patient> {
    return this.repository.save(this.repository.create(data));
  }

  save(patient: Patient): Promise<Patient> {
    return this.repository.save(patient);
  }

  async softDelete(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }
}
