import { configSchema } from './validation.schema';

export const schemaValidator: (
  config: Record<string, any>,
) => Record<string, any> = (config) => {
  const parsed = configSchema.safeParse(config);
  if (!parsed.success) {
    // Extract and format error messages
    const errors = parsed.error.issues
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    throw new Error(`Configuration validation error: ${errors}`);
  }
  return parsed.data; // Return the validated and transformed config
};
