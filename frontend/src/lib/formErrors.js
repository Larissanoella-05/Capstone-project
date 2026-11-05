/**
 * One entry per field with an error, in page order; each links to its field.
 * @param {Record<string, string | undefined>} errors message by field key
 * @param {{ key: string, id: string }[]} fields the fields in page order
 */
export function errorSummary(errors, fields) {
  return fields
    .filter((field) => errors[field.key])
    .map((field) => ({ id: field.id, message: errors[field.key] }));
}
