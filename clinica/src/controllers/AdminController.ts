import { Request, Response } from 'express';

export class AdminController {
  ping = (request: Request, response: Response): void => {
    response.status(200).json({
      message: 'pong',
      requestedBy: request.user
        ? { id: request.user.id, email: request.user.email, role: request.user.role }
        : null,
      timestamp: new Date().toISOString(),
    });
  };
}
