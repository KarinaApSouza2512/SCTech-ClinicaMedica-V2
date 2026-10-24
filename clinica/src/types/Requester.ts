import { Role } from '../enums/Role';

// Quem fez a requisicao, como vem do token; os services decidem posse e autoridade com isso
export interface Requester {
  id: number;
  roles: Role[];
}
