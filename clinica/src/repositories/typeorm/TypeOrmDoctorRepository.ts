import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Doctor } from '../../entities/Doctor';
import { User } from '../../entities/User';
import { Role } from '../../enums/Role';
import { uniqueViolationError } from '../../errors/uniqueViolation';
import { IDoctorRepository, NewDoctorData } from '../ports/IDoctorRepository';

@Injectable()
export class TypeOrmDoctorRepository implements IDoctorRepository {
  private readonly repository: Repository<Doctor>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(Doctor);
  }

  findByCrm(crm: string): Promise<Doctor | null> {
    return this.repository.findOne({ where: { crm }, relations: { user: true } });
  }

  async createWithUser(data: NewDoctorData): Promise<Doctor> {
    try {
      // Dentro do callback tudo passa pelo manager, que usa a conexao da transacao
      return await this.dataSource.transaction(async (manager) => {
        const users = manager.getRepository(User);
        const doctors = manager.getRepository(Doctor);

        const user = await users.save(
          users.create({
            name: data.name,
            email: data.email,
            password: data.password,
            roles: [Role.DOCTOR],
          }),
        );

        return doctors.save(doctors.create({ crm: data.crm, userId: user.id, user }));
      });
    } catch (error) {
      // Corrida com outro cadastro: a constraint barrou e o rollback ja desfez o usuario
      throw uniqueViolationError(error) ?? error;
    }
  }
}
