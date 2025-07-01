
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  let score = 0;
  
  // Minimum length check
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  } else {
    score += 1;
  }
  
  // Contains uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula');
  } else {
    score += 1;
  }
  
  // Contains lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula');
  } else {
    score += 1;
  }
  
  // Contains number
  if (!/\d/.test(password)) {
    errors.push('Debe contener al menos un número');
  } else {
    score += 1;
  }
  
  // Contains special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial');
  } else {
    score += 1;
  }
  
  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 4) {
    strength = 'strong';
  } else if (score >= 3) {
    strength = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};

export const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'strong':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

export const getPasswordStrengthText = (strength: 'weak' | 'medium' | 'strong'): string => {
  switch (strength) {
    case 'weak':
      return 'Débil';
    case 'medium':
      return 'Medio';
    case 'strong':
      return 'Fuerte';
    default:
      return '';
  }
};
