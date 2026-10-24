import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../decorators/CurrentUser';
import { Roles } from '../decorators/Roles';
import { CreateAppointmentDto } from '../dto/CreateAppointmentDto';
import { IdParamDto } from '../dto/IdParamDto';
import { ListAppointmentsQueryDto } from '../dto/ListAppointmentsQueryDto';
import { UpdateAppointmentStatusDto } from '../dto/UpdateAppointmentStatusDto';
import { Role } from '../enums/Role';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { RolesGuard } from '../guards/RolesGuard';
import { AppointmentResponse, toAppointmentResponse } from '../mappers/AppointmentMapper';
import { AppointmentService } from '../services/AppointmentService';
import { Paginated } from '../utils/pagination';

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

  @Get()
  async list(
    @Query() query: ListAppointmentsQueryDto,
    @CurrentUser() user: Express.AuthenticatedUser,
  ): Promise<Paginated<AppointmentResponse>> {
    const page = await this.appointmentService.list(query, user);
    return { data: page.data.map(toAppointmentResponse), meta: page.meta };
  }

  @Get(':id')
  async findById(
    @Param() params: IdParamDto,
    @CurrentUser() user: Express.AuthenticatedUser,
  ): Promise<AppointmentResponse> {
    return toAppointmentResponse(await this.appointmentService.findById(params.id, user));
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
