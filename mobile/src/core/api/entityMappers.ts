import { z } from 'zod';
import { AppError } from '../errors/error-handler';
import { err, ok, type Result } from '../errors/result';

/**
 * Pure functions mapping raw DB/API payloads to typed domain entities.
 * Follows blueprint §5.2: Zod runtime validation at boundaries.
 */

export function mapWithSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
  entityName = 'Entity'
): Result<T, AppError> {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    const issueSummary = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');

    return err(
      new AppError(`Invalid ${entityName} data format: ${issueSummary}`, {
        code: 'VALIDATION_ERROR',
        details: parsed.error.issues,
      })
    );
  }

  return ok(parsed.data);
}

export function mapArrayWithSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
  entityName = 'Entity'
): Result<T[], AppError> {
  if (!Array.isArray(data)) {
    return err(
      new AppError(`Expected array for ${entityName} collection, received ${typeof data}`, {
        code: 'VALIDATION_ERROR',
      })
    );
  }

  const arraySchema = z.array(schema);
  return mapWithSchema(arraySchema, data, `${entityName}Collection`);
}
