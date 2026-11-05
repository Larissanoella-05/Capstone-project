import { badRequest } from '../utils/httpError.js';

/**
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body' | 'query'} [source]
 */
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(badRequest(details[0]?.message || 'Check the form and try again.', details));
    }
    req[source] = result.data;
    next();
  };
