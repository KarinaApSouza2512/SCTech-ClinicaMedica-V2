import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/Roles';
import { CreateAppointmentDto } from '../dto/CreateAppointmentDto';
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
}
