import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/Roles';
import { CreatePatientDto } from '../dto/CreatePatientDto';
import { Role } from '../enums/Role';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { RolesGuard } from '../guards/RolesGuard';
import { PatientResponse, toPatientResponse } from '../mappers/PatientMapper';
import { PatientService } from '../services/PatientService';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SECRETARY)
  async create(@Body() body: CreatePatientDto): Promise<PatientResponse> {
    return toPatientResponse(await this.patientService.create(body));
  }
}
