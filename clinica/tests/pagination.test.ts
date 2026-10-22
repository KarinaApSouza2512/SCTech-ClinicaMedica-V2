import 'reflect-metadata';
import { ArgumentMetadata } from '@nestjs/common';
import { PaginationQueryDto } from '../src/dto/PaginationQueryDto';
import { DtoValidationPipe } from '../src/pipes/DtoValidationPipe';
import { buildPage, pageOffset } from '../src/utils/pagination';

describe('PaginationQueryDto', () => {
  const pipe = new DtoValidationPipe();
  const query: ArgumentMetadata = { type: 'query', metatype: PaginationQueryDto };

  it('usa page 1 e pageSize 20 quando nada e informado', async () => {
    await expect(pipe.transform({}, query)).resolves.toEqual({ page: 1, pageSize: 20 });
  });

  it('converte os valores da query para numero', async () => {
    await expect(pipe.transform({ page: '3', pageSize: '100' }, query)).resolves.toEqual({
      page: 3,
      pageSize: 100,
    });
  });

  it.each([
    { page: '0' },
    { page: 'abc' },
    { pageSize: '0' },
    { pageSize: '101' },
    { pageSize: '2.5' },
  ])('recusa %o com DADOS_INVALIDOS', async (value) => {
    await expect(pipe.transform(value, query)).rejects.toMatchObject({
      code: 'DADOS_INVALIDOS',
    });
  });
});

describe('pagination', () => {
  it('calcula o deslocamento da pagina', () => {
    expect(pageOffset({ page: 1, pageSize: 20 })).toBe(0);
    expect(pageOffset({ page: 3, pageSize: 20 })).toBe(40);
  });

  it('monta o envelope com o total de paginas arredondado para cima', () => {
    expect(buildPage(['a', 'b'], 57, { page: 1, pageSize: 20 })).toEqual({
      data: ['a', 'b'],
      meta: { total: 57, page: 1, pageSize: 20, totalPages: 3 },
    });
  });

  it('devolve zero paginas quando nao ha registros', () => {
    expect(buildPage([], 0, { page: 1, pageSize: 20 }).meta.totalPages).toBe(0);
  });
});
