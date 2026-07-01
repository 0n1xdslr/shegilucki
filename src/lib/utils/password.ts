export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
  message: string;
  score: number; // Score from 0 to 5
}

export function validatePassword(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 10;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  // Matches any standard special character including common punctuation
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/;`~]/.test(password);

  let score = 0;
  if (password.length > 0) {
    let subScore = 0;
    if (password.length >= 6) subScore++;
    if (hasMinLength) subScore++;
    if (hasUppercase) subScore++;
    if (hasLowercase) subScore++;
    if (hasDigit) subScore++;
    if (hasSpecial) subScore++;
    // Normalize to 0-5
    score = Math.min(Math.round((subScore / 6) * 5), 5);
  }

  let message = '';
  if (!hasMinLength) {
    message = 'La contraseña debe tener al menos 10 caracteres.';
  } else if (!hasUppercase) {
    message = 'La contraseña debe tener al menos una letra mayúscula (A-Z).';
  } else if (!hasLowercase) {
    message = 'La contraseña debe tener al menos una letra minúscula (a-z).';
  } else if (!hasDigit) {
    message = 'La contraseña debe tener al menos un número (0-9).';
  } else if (!hasSpecial) {
    message = 'La contraseña debe tener al menos un carácter especial (ej. !, @, #, $, *, etc.).';
  }

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;

  return {
    isValid,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasDigit,
    hasSpecial,
    message,
    score
  };
}
