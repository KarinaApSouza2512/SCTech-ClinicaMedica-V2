import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

type DtoConstructor<T> = new () => T;

interface FieldError {
  field: string;
  messages: string[];
}

export function validateDto<T extends object>(dtoClass: DtoConstructor<T>) {
  return async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(dtoClass, request.body as unknown);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const details: FieldError[] = errors.map((error) => ({
        field: error.property,
        messages: Object.values(error.constraints ?? {}),
      }));
      next(AppError.badRequest('Dados de entrada invalidos', details));
      return;
    }

    request.body = instance;
    next();
  };
}
