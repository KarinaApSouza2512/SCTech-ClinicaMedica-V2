import { Appointment } from '../entities/Appointment';
import { AppointmentStatus } from '../enums/AppointmentStatus';
import type { DoctorCalendar } from '../services/AppointmentService';
import { toWorkScheduleResponse, WorkScheduleResponse } from './WorkScheduleMapper';

// Datas saem em UTC, no formato ISO com Z
export interface AppointmentResponse {
  id: number;
  doctorId: number;
  patientId: number;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
}

export function toAppointmentResponse(appointment: Appointment): AppointmentResponse {
  return {
    id: appointment.id,
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    status: appointment.status,
  };
}

// O medico ja esta na rota, entao doctorId nao se repete em cada item
export type CalendarAppointmentResponse = Omit<AppointmentResponse, 'doctorId'>;

export interface CalendarResponse {
  workSchedule: WorkScheduleResponse;
  appointments: CalendarAppointmentResponse[];
}

function toCalendarAppointment(appointment: Appointment): CalendarAppointmentResponse {
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    status: appointment.status,
  };
}

export function toCalendarResponse(calendar: DoctorCalendar): CalendarResponse {
  return {
    workSchedule: toWorkScheduleResponse(calendar.shifts),
    appointments: calendar.appointments.map(toCalendarAppointment),
  };
}
