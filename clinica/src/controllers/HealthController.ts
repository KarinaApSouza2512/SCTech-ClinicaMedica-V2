import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root(): { name: string; stage: string } {
    return { name: 'MedClinic API', stage: 'Autenticacao e Autorizacao' };
  }

  @Get('health')
  health(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
