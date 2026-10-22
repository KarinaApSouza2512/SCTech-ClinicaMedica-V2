import { Request, Response } from 'express';
import { LoginDto } from '../dto/LoginDto';
import { RegisterDto } from '../dto/RegisterDto';
import { AuthService } from '../services/AuthService';

type TypedBody<T> = Request<Record<string, string>, unknown, T>;

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (request: TypedBody<RegisterDto>, response: Response): Promise<void> => {
    const user = await this.authService.register(request.body);
    response.status(201).json(user);
  };

  login = async (request: TypedBody<LoginDto>, response: Response): Promise<void> => {
    const result = await this.authService.login(request.body);
    response.status(200).json(result);
  };
}
