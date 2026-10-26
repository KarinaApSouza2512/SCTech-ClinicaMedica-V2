import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../decorators/Roles';
import { CreateDoctorDto } from '../dto/CreateDoctorDto';
import { IdParamDto } from '../dto/IdParamDto';
import { ListDoctorsQueryDto } from '../dto/ListDoctorsQueryDto';
import { Role } from '../enums/Role';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { RolesGuard } from '../guards/RolesGuard';
import { DoctorResponse, toDoctorResponse } from '../mappers/DoctorMapper';
import { DoctorService } from '../services/DoctorService';
import { Paginated } from '../utils/pagination';

// Rotas sem @Roles aceitam qualquer usuario autenticado
@ApiTags('Médicos')
@ApiBearerAuth()
@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() body: CreateDoctorDto): Promise<DoctorResponse> {
    return toDoctorResponse(await this.doctorService.create(body));
  }

  @Get()
  async list(@Query() query: ListDoctorsQueryDto): Promise<Paginated<DoctorResponse>> {
    const page = await this.doctorService.list(query);
    return { data: page.data.map(toDoctorResponse), meta: page.meta };
  }

  @Get(':id')
  async findById(@Param() params: IdParamDto): Promise<DoctorResponse> {
    return toDoctorResponse(await this.doctorService.findById(params.id));
  }
}
