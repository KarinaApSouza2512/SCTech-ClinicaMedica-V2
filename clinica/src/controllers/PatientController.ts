import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../decorators/Roles';
import { CreatePatientDto } from '../dto/CreatePatientDto';
import { IdParamDto } from '../dto/IdParamDto';
import { ListPatientsQueryDto } from '../dto/ListPatientsQueryDto';
import { UpdatePatientDto } from '../dto/UpdatePatientDto';
import { Role } from '../enums/Role';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { RolesGuard } from '../guards/RolesGuard';
import { PatientResponse, toPatientResponse } from '../mappers/PatientMapper';
import { PatientService } from '../services/PatientService';
import { Paginated } from '../utils/pagination';

// Rotas sem @Roles aceitam qualquer usuario autenticado
@ApiTags('Pacientes')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SECRETARY)
  async create(@Body() body: CreatePatientDto): Promise<PatientResponse> {
    return toPatientResponse(await this.patientService.create(body));
  }

  @Get()
  async list(@Query() query: ListPatientsQueryDto): Promise<Paginated<PatientResponse>> {
    const page = await this.patientService.list(query);
    return { data: page.data.map(toPatientResponse), meta: page.meta };
  }

  @Get(':id')
  async findById(@Param() params: IdParamDto): Promise<PatientResponse> {
    return toPatientResponse(await this.patientService.findById(params.id));
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SECRETARY)
  async update(
    @Param() params: IdParamDto,
    @Body() body: UpdatePatientDto,
  ): Promise<PatientResponse> {
    return toPatientResponse(await this.patientService.update(params.id, body));
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() params: IdParamDto): Promise<void> {
    await this.patientService.remove(params.id);
  }
}
