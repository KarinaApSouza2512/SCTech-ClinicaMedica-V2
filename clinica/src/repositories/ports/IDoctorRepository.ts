import { Doctor } from '../../entities/Doctor';

export interface NewDoctorData {
  name: string;
  email: string;
  // Senha ja com hash
  password: string;
  crm: string;
}

// Porta usada pelos services; os testes trocam por um duble.
// Todo Doctor devolvido vem com o user carregado.
export interface IDoctorRepository {
  findByCrm(crm: string): Promise<Doctor | null>;
  // Grava usuario (perfil doctor) e medico na mesma transacao: ou os dois, ou nenhum
  createWithUser(data: NewDoctorData): Promise<Doctor>;
}

// Token de injecao: a interface nao existe em tempo de execucao
export const DOCTOR_REPOSITORY = Symbol('IDoctorRepository');
