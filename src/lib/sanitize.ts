/**
 * Sanitize form values before sending to the database.
 * Converts empty strings to null for UUID and numeric fields
 * to prevent database constraint errors.
 */
export function sanitizeFormValues<T extends Record<string, unknown>>(
  values: T,
  uuidFields: string[] = [],
  numericFields: string[] = []
): T {
  const result = { ...values };
  for (const key of uuidFields) {
    if (key in result && (result[key] === "" || result[key] === undefined)) {
      (result as any)[key] = null;
    }
  }
  for (const key of numericFields) {
    if (key in result) {
      const val = result[key];
      if (val === "" || val === undefined || (typeof val === "number" && isNaN(val))) {
        (result as any)[key] = null;
      }
    }
  }
  return result;
}

/** Common UUID fields for projects */
export const PROJECT_UUID_FIELDS = ["category_id", "region_id", "city_id", "assigned_provider_id"];
/** Common numeric fields for projects */
export const PROJECT_NUMERIC_FIELDS = ["estimated_hours", "budget"];

/** Common UUID fields for micro_services */
export const SERVICE_UUID_FIELDS = ["category_id", "region_id", "city_id"];
/** Common numeric fields for micro_services */
export const SERVICE_NUMERIC_FIELDS = ["price", "display_order", "sales_count", "service_views"];
