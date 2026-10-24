import { Module } from '@nestjs/common';
import { UserController } from '../controllers/UserController';
import { USER_REPOSITORY } from '../repositories/ports/IUserRepository';
import { TypeOrmUserRepository } from '../repositories/typeorm/TypeOrmUserRepository';
import { UserService } from '../services/UserService';

@Module({
  controllers: [UserController],
  providers: [{ provide: USER_REPOSITORY, useClass: TypeOrmUserRepository }, UserService],
  // O repositorio sai do modulo para o DoctorService checar e-mail repetido
  exports: [UserService, USER_REPOSITORY],
})
export class UserModule {}
