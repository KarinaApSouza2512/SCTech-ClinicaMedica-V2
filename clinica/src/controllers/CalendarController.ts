import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CalendarQueryDto } from '../dto/CalendarQueryDto';
import { DoctorIdParamDto } from '../dto/DoctorIdParamDto';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { CalendarResponse, toCalendarResponse } from '../mappers/AppointmentMapper';
import { AppointmentService } from '../services/AppointmentService';

@ApiTags('Agenda do médico')
@ApiBearerAuth()
@Controller('doctors/:doctorId/calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  async find(
    @Param() params: DoctorIdParamDto,
    @Query() query: CalendarQueryDto,
  ): Promise<CalendarResponse> {
    const calendar = await this.appointmentService.calendar(params.doctorId, query.from, query.to);
    return toCalendarResponse(calendar);
  }
}
