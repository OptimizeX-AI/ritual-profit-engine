import { z } from 'zod';

/**
 * Validation schemas for all data mutations
 * Ensures input validation before sending to database
 */

// Client validation schema
export const ClientSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .trim(),
  fee_mensal_centavos: z.number()
    .int('Valor deve ser inteiro')
    .min(0, 'Valor não pode ser negativo')
    .max(1000000000, 'Valor muito alto')
    .optional()
    .default(0),
  contrato_inicio: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional()
    .nullable(),
  contrato_fim: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional()
    .nullable(),
});

export type ValidatedClientInput = z.infer<typeof ClientSchema>;

// Project validation schema
export const ProjectSchema = z.object({
  client_id: z.string()
    .uuid('ID do cliente inválido'),
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .trim(),
  horas_contratadas: z.number()
    .int('Valor deve ser inteiro')
    .min(0, 'Horas não podem ser negativas')
    .max(100000, 'Valor muito alto')
    .optional()
    .default(0),
});

export type ValidatedProjectInput = z.infer<typeof ProjectSchema>;

// Team member update validation schema
export const TeamMemberUpdateSchema = z.object({
  id: z.string().uuid('ID inválido'),
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .trim()
    .optional(),
  custo_hora_centavos: z.number()
    .int('Valor deve ser inteiro')
    .min(0, 'Valor não pode ser negativo')
    .max(1000000000, 'Valor muito alto')
    .optional()
    .nullable(),
});

export type ValidatedTeamMemberUpdate = z.infer<typeof TeamMemberUpdateSchema>;

// Login validation schema
export const LoginSchema = z.object({
  email: z.string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido')
    .max(255, 'E-mail muito longo')
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(128, 'Senha muito longa'),
});

export type ValidatedLoginInput = z.infer<typeof LoginSchema>;

// Signup validation schema
export const SignupSchema = z.object({
  email: z.string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido')
    .max(255, 'E-mail muito longo')
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(128, 'Senha muito longa'),
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .trim(),
  organization_name: z.string()
    .max(255, 'Nome da organização deve ter no máximo 255 caracteres')
    .trim()
    .optional()
    .default('Minha Agência'),
});

export type ValidatedSignupInput = z.infer<typeof SignupSchema>;

/**
 * Validation helper class for handling validation errors
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Parse and validate input, throws ValidationError on failure
 */
export function parseInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  
  if (result.success) {
    return result.data;
  }
  
  // Throw with the first error message
  const firstError = result.error.errors[0];
  throw new ValidationError(firstError.message);
}

/**
 * Safe validation that returns null on failure (for optional validation)
 */
export function tryParseInput<T>(schema: z.ZodSchema<T>, input: unknown): T | null {
  const result = schema.safeParse(input);
  return result.success ? result.data : null;
}
