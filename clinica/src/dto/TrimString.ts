import { Transform } from 'class-transformer';

// Remove espacos das pontas antes da validacao, para "   " contar como vazio
export function TrimString(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}
