import { WorkShift } from '../entities/WorkShift';
import { formatTime } from '../utils/time';

export interface WorkShiftResponse {
  weekDay: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface WorkScheduleResponse {
  shifts: WorkShiftResponse[];
}

// Mesmo formato do corpo do PUT, com as horas em HH:MM
export function toWorkScheduleResponse(shifts: WorkShift[]): WorkScheduleResponse {
  return {
    shifts: shifts.map((shift) => ({
      weekDay: shift.weekDay,
      startTime: formatTime(shift.startTime),
      endTime: formatTime(shift.endTime),
      slotDurationMinutes: shift.slotDurationMinutes,
    })),
  };
}
