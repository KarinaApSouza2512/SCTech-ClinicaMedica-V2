import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, FindManyOptions } from 'typeorm';
import { Doctor } from '../../entities/Doctor';
import { WorkShift } from '../../entities/WorkShift';
import { IWorkScheduleRepository, ShiftData } from '../ports/IWorkScheduleRepository';

function byDoctor(doctorId: number): FindManyOptions<WorkShift> {
  return { where: { doctorId }, order: { weekDay: 'ASC', startTime: 'ASC' } };
}

@Injectable()
export class TypeOrmWorkScheduleRepository implements IWorkScheduleRepository {
  constructor(private readonly dataSource: DataSource) {}

  findByDoctorId(doctorId: number): Promise<WorkShift[]> {
    return this.dataSource.getRepository(WorkShift).find(byDoctor(doctorId));
  }

  replaceForDoctor(doctorId: number, shifts: ShiftData[]): Promise<WorkShift[]> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      // Trava a linha do medico: dois PUT simultaneos nao misturam as escalas
      await manager
        .getRepository(Doctor)
        .findOne({ where: { id: doctorId }, lock: { mode: 'pessimistic_write' } });

      const repository = manager.getRepository(WorkShift);
      await repository.delete({ doctorId });
      await repository.insert(shifts.map((shift) => ({ ...shift, doctorId })));

      return repository.find(byDoctor(doctorId));
    });
  }
}
