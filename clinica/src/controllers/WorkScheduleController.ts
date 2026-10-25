import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../decorators/Roles';
import { DoctorIdParamDto } from '../dto/DoctorIdParamDto';
import { WorkScheduleDto } from '../dto/WorkScheduleDto';
import { Role } from '../enums/Role';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { RolesGuard } from '../guards/RolesGuard';
import { toWorkScheduleResponse, WorkScheduleResponse } from '../mappers/WorkScheduleMapper';
import { WorkScheduleService } from '../services/WorkScheduleService';

@ApiTags('Escala de trabalho')
@ApiBearerAuth()
@Controller('doctors/:doctorId/work-schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkScheduleController {
  constructor(private readonly workScheduleService: WorkScheduleService) {}

  @Put()
  @Roles(Role.ADMIN)
  async replace(
    @Param() params: DoctorIdParamDto,
    @Body() body: WorkScheduleDto,
  ): Promise<WorkScheduleResponse> {
    const shifts = await this.workScheduleService.replace(params.doctorId, body.shifts);
    return toWorkScheduleResponse(shifts);
  }

  @Get()
  async find(@Param() params: DoctorIdParamDto): Promise<WorkScheduleResponse> {
    return toWorkScheduleResponse(await this.workScheduleService.findByDoctorId(params.doctorId));
  }
}
