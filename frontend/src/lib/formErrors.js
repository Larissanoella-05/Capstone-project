/**
 * The entries of the "There is a problem" summary: one per field that has an error, in the order
 * the fields appear on the page. Each entry links to its field and repeats the inline message.
 * @param {Record<string, string | undefined>} errors message by field key
 * @param {{ key: string, id: string }[]} fields the fields in page order
 */
export function errorSummary(errors, fields) {
  return fields
    .filter((field) => errors[field.key])
    .map((field) => ({ id: field.id, message: errors[field.key] }));
}
