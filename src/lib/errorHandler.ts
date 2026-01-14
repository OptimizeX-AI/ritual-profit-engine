/**
 * Error handler utility to sanitize database errors
 * Prevents leaking internal database structure to users
 */

export function handleDatabaseError(error: Error, operation: string): string {
  // Log full error for debugging (server-side in production)
  console.error(`Database error in ${operation}:`, error);

  const message = error.message.toLowerCase();

  // Map common database errors to user-friendly messages
  if (message.includes('unique constraint') || message.includes('duplicate key')) {
    return 'Este registro já existe.';
  }
  
  if (message.includes('foreign key') || message.includes('violates foreign key constraint')) {
    return 'Não é possível remover: registro está em uso.';
  }
  
  if (message.includes('permission denied') || message.includes('row-level security')) {
    return 'Você não tem permissão para esta ação.';
  }
  
  if (message.includes('not found') || message.includes('no rows')) {
    return 'Registro não encontrado.';
  }
  
  if (message.includes('invalid input') || message.includes('invalid value')) {
    return 'Dados inválidos. Verifique os campos.';
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet.';
  }

  // Generic fallback - never expose internal details
  return `Erro ao ${operation}. Tente novamente.`;
}

export function handleAuthError(error: Error): string {
  console.error('Auth error:', error);
  
  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials') || message.includes('invalid password')) {
    return 'E-mail ou senha incorretos.';
  }
  
  if (message.includes('email already registered') || message.includes('user already registered')) {
    return 'Este e-mail já está cadastrado.';
  }
  
  if (message.includes('password') && message.includes('weak')) {
    return 'Senha muito fraca. Use pelo menos 6 caracteres.';
  }
  
  if (message.includes('email') && (message.includes('invalid') || message.includes('format'))) {
    return 'E-mail inválido.';
  }
  
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Muitas tentativas. Aguarde alguns minutos.';
  }

  return 'Erro na autenticação. Tente novamente.';
}
