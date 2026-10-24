import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { MedicalRecord } from '../../entities/MedicalRecord';
import { pageOffset, PaginationParams } from '../../utils/pagination';
import { IMedicalRecordRepository, NewMedicalRecordData } from '../ports/IMedicalRecordRepository';

@Injectable()
export class TypeOrmMedicalRecordRepository implements IMedicalRecordRepository {
  private readonly repository: Repository<MedicalRecord>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(MedicalRecord);
  }

  create(data: NewMedicalRecordData): Promise<MedicalRecord> {
    return this.repository.save(this.repository.create(data));
  }

  findPageByPatient(patientId: number, page: PaginationParams): Promise<[MedicalRecord[], number]> {
    return this.repository.findAndCount({
      where: { patientId },
      // id desempata registros gravados no mesmo instante
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: pageOffset(page),
      take: page.pageSize,
    });
  }
}
