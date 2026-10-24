import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../decorators/CurrentUser';
import { Roles } from '../decorators/Roles';
import { CreateAppointmentDto } from '../dto/CreateAppointmentDto';
import { IdParamDto } from '../dto/IdParamDto';
import { UpdateAppointmentStatusDto } from '../dto/UpdateAppointmentStatusDto';
import { Role } from '../enums/Role';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { RolesGuard } from '../guards/RolesGuard';
import { AppointmentResponse, toAppointmentResponse } from '../mappers/AppointmentMapper';
import { AppointmentService } from '../services/AppointmentService';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SECRETARY)
  async create(@Body() body: CreateAppointmentDto): Promise<AppointmentResponse> {
    const appointment = await this.appointmentService.create({
      doctorId: body.doctorId,
      patientId: body.patientId,
      startsAt: new Date(body.startsAt),
    });

    return toAppointmentResponse(appointment);
  }

  // Qualquer autenticado chega aqui; quem pode cada transicao e decidido no service
  @Patch(':id/status')
  async changeStatus(
    @Param() params: IdParamDto,
    @Body() body: UpdateAppointmentStatusDto,
    @CurrentUser() user: Express.AuthenticatedUser,
  ): Promise<AppointmentResponse> {
    const appointment = await this.appointmentService.changeStatus(params.id, body.status, user);
    return toAppointmentResponse(appointment);
  }
}
