import { badRequest } from '../utils/httpError.js';

/** Validates req.body against a zod schema and replaces it with the parsed value. */
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
    return next(badRequest(details[0]?.message || 'Check the form and try again.', details));
  }
  req.body = result.data;
  next();
};
