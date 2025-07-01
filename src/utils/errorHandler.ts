
import { secureLogger } from './secureLogger';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: string, statusCode: number = 400, isOperational: boolean = true) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createUserFriendlyError = (error: any): { message: string; code: string } => {
  const isDevelopment = import.meta.env.DEV;
  
  // Log the actual error for debugging
  secureLogger.error('Application error occurred', {
    message: error?.message,
    code: error?.code,
    stack: isDevelopment ? error?.stack : undefined
  });
  
  // Return sanitized error for user display
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code
    };
  }
  
  // Handle common Supabase auth errors with user-friendly messages
  const authErrorMap: Record<string, string> = {
    'Invalid login credentials': 'Credenciales incorrectas. Verifica tu email y contraseña.',
    'User already registered': 'Este email ya está registrado. Intenta iniciar sesión.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 8 caracteres.',
    'Invalid email': 'El formato del email no es válido.',
    'Email not confirmed': 'Por favor confirma tu email antes de iniciar sesión.',
    'Signup not allowed': 'El registro no está permitido en este momento.',
    'Email rate limit exceeded': 'Se han enviado demasiados emails. Intenta más tarde.'
  };
  
  const errorMessage = error?.message || 'Error desconocido';
  const userFriendlyMessage = authErrorMap[errorMessage] || 'Ha ocurrido un error. Por favor intenta nuevamente.';
  
  return {
    message: userFriendlyMessage,
    code: error?.code || 'UNKNOWN_ERROR'
  };
};

export const handleAsyncError = async <T>(
  promise: Promise<T>,
  context?: string
): Promise<[T | null, { message: string; code: string } | null]> => {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    if (context) {
      secureLogger.error(`Error in ${context}`, { error: error?.message });
    }
    return [null, createUserFriendlyError(error)];
  }
};
