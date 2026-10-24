import { IsISO8601, Matches } from 'class-validator';

// Data local 'YYYY-MM-DD' que existe no calendario (2026-02-30 e recusada)
export function IsLocalDate(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property deve estar no formato YYYY-MM-DD' })(
      target,
      propertyKey,
    );
    IsISO8601({ strict: true }, { message: '$property deve ser uma data valida' })(
      target,
      propertyKey,
    );
  };
}
