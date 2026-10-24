import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../decorators/CurrentUser';
import { Roles } from '../decorators/Roles';
import { CreateMedicalRecordDto } from '../dto/CreateMedicalRecordDto';
import { PaginationQueryDto } from '../dto/PaginationQueryDto';
import { PatientIdParamDto } from '../dto/PatientIdParamDto';
import { Role } from '../enums/Role';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { RolesGuard } from '../guards/RolesGuard';
import { MedicalRecordResponse, toMedicalRecordResponse } from '../mappers/MedicalRecordMapper';
import { MedicalRecordService } from '../services/MedicalRecordService';
import { Paginated } from '../utils/pagination';

// @Roles barra quem nunca pode; o vinculo de atendimento e conferido no service
@Controller('patients/:patientId/medical-records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalRecordController {
  constructor(private readonly medicalRecordService: MedicalRecordService) {}

  // Escrever no prontuario e ato medico: admin e secretary recebem 403
  @Post()
  @Roles(Role.DOCTOR)
  async create(
    @Param() params: PatientIdParamDto,
    @Body() body: CreateMedicalRecordDto,
    @CurrentUser() user: Express.AuthenticatedUser,
  ): Promise<MedicalRecordResponse> {
    const record = await this.medicalRecordService.create(params.patientId, body.text, user);
    return toMedicalRecordResponse(record);
  }

  @Get()
  @Roles(Role.DOCTOR)
  async list(
    @Param() params: PatientIdParamDto,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: Express.AuthenticatedUser,
  ): Promise<Paginated<MedicalRecordResponse>> {
    const page = await this.medicalRecordService.list(params.patientId, query, user);
    return { data: page.data.map(toMedicalRecordResponse), meta: page.meta };
  }
}
