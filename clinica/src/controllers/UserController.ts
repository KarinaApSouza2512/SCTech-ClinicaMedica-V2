import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { AppError } from '../utils/AppError';

export class UserController {
  constructor(private readonly userService: UserService) {}

  me = async (request: Request, response: Response): Promise<void> => {
    if (!request.user) {
      throw AppError.unauthorized('Autenticacao requerida');
    }

    const user = await this.userService.findById(request.user.id);
    response.status(200).json(this.userService.toPublic(user));
  };
}
