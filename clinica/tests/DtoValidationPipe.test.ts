import 'reflect-metadata';
import { ArgumentMetadata } from '@nestjs/common';
import { CreateUserDto } from '../src/dto/CreateUserDto';
import { IdParamDto } from '../src/dto/IdParamDto';
import { LoginDto } from '../src/dto/LoginDto';
import { DomainError } from '../src/errors/DomainError';
import { DtoValidationPipe } from '../src/pipes/DtoValidationPipe';

describe('DtoValidationPipe', () => {
  const pipe = new DtoValidationPipe();
  const param: ArgumentMetadata = { type: 'param', metatype: IdParamDto };
  const body: ArgumentMetadata = { type: 'body', metatype: LoginDto };

  it('converte o parametro id para numero', async () => {
    await expect(pipe.transform({ id: '42' }, param)).resolves.toEqual({ id: 42 });
  });

  it.each(['abc', '0', '1.5'])('recusa o id %s com DADOS_INVALIDOS', async (id) => {
    const result = pipe.transform({ id }, param);

    await expect(result).rejects.toBeInstanceOf(DomainError);
    await expect(result).rejects.toMatchObject({ code: 'DADOS_INVALIDOS' });
  });

  it('ignora campos que nao estao no DTO', async () => {
    const result = await pipe.transform({ email: 'ana@x.com', password: '123', doctorId: 7 }, body);

    expect(result).toEqual({ email: 'ana@x.com', password: '123' });
  });

  it('recusa corpo ausente com DADOS_INVALIDOS', async () => {
    await expect(pipe.transform(undefined, body)).rejects.toMatchObject({
      code: 'DADOS_INVALIDOS',
    });
  });

  describe('CreateUserDto', () => {
    const createUser: ArgumentMetadata = { type: 'body', metatype: CreateUserDto };
    const valid = {
      name: 'Joana',
      email: 'joana@medclinic.com',
      password: 'SenhaForte@123',
      roles: ['secretary'],
    };

    it('aceita perfis validos', async () => {
      await expect(pipe.transform(valid, createUser)).resolves.toMatchObject(valid);
    });

    it.each([[['root']], [[]], ['admin']])('recusa roles %j com DADOS_INVALIDOS', async (roles) => {
      await expect(pipe.transform({ ...valid, roles }, createUser)).rejects.toMatchObject({
        code: 'DADOS_INVALIDOS',
      });
    });
  });
});
