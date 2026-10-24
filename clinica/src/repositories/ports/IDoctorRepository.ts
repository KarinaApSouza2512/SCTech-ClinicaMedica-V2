import { Doctor } from '../../entities/Doctor';
import { PaginationParams } from '../../utils/pagination';

export interface NewDoctorData {
  name: string;
  email: string;
  // Senha ja com hash
  password: string;
  crm: string;
}

export interface DoctorFilter extends PaginationParams {
  // Trecho do nome do usuario do medico; sem ele, lista todos
  name?: string;
}

// Porta usada pelos services; os testes trocam por um duble.
// Todo Doctor devolvido vem com o user carregado.
export interface IDoctorRepository {
  findById(id: number): Promise<Doctor | null>;
  findByUserId(userId: number): Promise<Doctor | null>;
  findByCrm(crm: string): Promise<Doctor | null>;
  // Pagina pedida e total de registros que atendem ao filtro
  findPage(filter: DoctorFilter): Promise<[Doctor[], number]>;
  // Grava usuario (perfil doctor) e medico na mesma transacao: ou os dois, ou nenhum
  createWithUser(data: NewDoctorData): Promise<Doctor>;
}

// Token de injecao: a interface nao existe em tempo de execucao
export const DOCTOR_REPOSITORY = Symbol('IDoctorRepository');
