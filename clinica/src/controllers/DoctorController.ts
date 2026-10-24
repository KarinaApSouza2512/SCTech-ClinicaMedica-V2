import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/Roles';
import { CreateDoctorDto } from '../dto/CreateDoctorDto';
import { Role } from '../enums/Role';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { RolesGuard } from '../guards/RolesGuard';
import { DoctorResponse, toDoctorResponse } from '../mappers/DoctorMapper';
import { DoctorService } from '../services/DoctorService';

@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() body: CreateDoctorDto): Promise<DoctorResponse> {
    return toDoctorResponse(await this.doctorService.create(body));
  }
}
