export const validateEmail = (email: unknown): { valid: boolean; error?: string } => {
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' };
  }

  const trimmed = email.trim().toLowerCase();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (trimmed.includes('..') || trimmed.startsWith('.')) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
};
export const validateStrongPassword = (password: unknown): { valid: boolean; error?: string } => {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/ [A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (!@#$%^&*)' };
  }

  return { valid: true };
};
export const validatePassword = (password: unknown): { valid: boolean; error?: string } => {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  return { valid: true };
};
export const validateName = (name: unknown): { valid: boolean; error?: string } => {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Name must be a string' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Name must not exceed 100 characters' };
  }

  return { valid: true };
};
export const validateQuantity = (quantity: unknown): { valid: boolean; error?: string } => {
  if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
    return { valid: false, error: 'Quantity must be an integer' };
  }

  if (quantity < 1) {
    return { valid: false, error: 'Quantity must be at least 1' };
  }

  if (quantity > 100) {
    return { valid: false, error: 'Quantity cannot exceed 100' };
  }

  return { valid: true };
};
export const validateAmount = (amount: unknown): { valid: boolean; error?: string } => {
  if (typeof amount !== 'number') {
    return { valid: false, error: 'Amount must be a number' };
  }

  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  return { valid: true };
};
export const validatePagination = (
  page: unknown,
  limit: unknown
): { valid: boolean; error?: string } => {
  if (typeof page !== 'number' || !Number.isInteger(page) || page < 1) {
    return { valid: false, error: 'Page must be an integer >= 1' };
  }

  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1) {
    return { valid: false, error: 'Limit must be an integer >= 1' };
  }

  if (limit > 100) {
    return { valid: false, error: 'Limit cannot exceed 100' };
  }

  return { valid: true };
};
export const validateTextField = (
  text: unknown,
  minLength: number = 1,
  maxLength: number = 5000
): { valid: boolean; error?: string } => {
  if (typeof text !== 'string') {
    return { valid: false, error: 'Text must be a string' };
  }

  if (text.trim().length < minLength) {
    return { valid: false, error: `Text must be at least ${minLength} characters` };
  }

  if (text.length > maxLength) {
    return { valid: false, error: `Text must not exceed ${maxLength} characters` };
  }

  return { valid: true };
};
export const validateUUID = (uuid: unknown): { valid: boolean; error?: string } => {
  if (typeof uuid !== 'string') {
    return { valid: false, error: 'UUID must be a string' };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid UUID format' };
  }

  return { valid: true };
};
export const validateURL = (url: unknown): { valid: boolean; error?: string } => {
  if (typeof url !== 'string') {
    return { valid: false, error: 'URL must be a string' };
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};
export function createValidationResult(valid: boolean, error?: string) {
  return { valid, error };
}
export function allValid(...results: Array<{ valid: boolean; error?: string }>): boolean {
  return results.every(r => r.valid);
}
export function getFirstError(...results: Array<{ valid: boolean; error?: string }>): string | null {
  return results.find(r => !r.valid)?.error ?? null;
}
export function getAllErrors(...results: Array<{ valid: boolean; error?: string }>): string[] {
  return results.filter(r => !r.valid).map(r => r.error!);
}
export const validateRegistrationForm = (
  email: unknown,
  password: unknown,
  name: unknown
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const emailResult = validateEmail(email);
  if (!emailResult.valid) errors.email = emailResult.error!;

  const passwordResult = validateStrongPassword(password);
  if (!passwordResult.valid) errors.password = passwordResult.error!;

  const nameResult = validateName(name);
  if (!nameResult.valid) errors.name = nameResult.error!;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
export const validateLoginForm = (
  email: unknown,
  password: unknown
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const emailResult = validateEmail(email);
  if (!emailResult.valid) errors.email = emailResult.error!;

  const passwordResult = validatePassword(password);
  if (!passwordResult.valid) errors.password = passwordResult.error!;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
export const validateChangePasswordForm = (
  oldPassword: unknown,
  newPassword: unknown,
  confirmPassword: unknown
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const oldPwResult = validatePassword(oldPassword);
  if (!oldPwResult.valid) errors.oldPassword = oldPwResult.error!;

  const newPwResult = validateStrongPassword(newPassword);
  if (!newPwResult.valid) errors.newPassword = newPwResult.error!;

  if (typeof confirmPassword !== 'string' || newPassword !== confirmPassword) {
    errors.confirmPassword = "Passwords don't match";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
export const validateOrderForm = (
  planId: unknown,
  quantity: unknown
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (typeof planId !== 'string' || planId.trim().length === 0) {
    errors.planId = 'Plan is required';
  }

  const quantityResult = validateQuantity(quantity);
  if (!quantityResult.valid) errors.quantity = quantityResult.error!;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
export const validatePaymentForm = (
  orderId: unknown,
  amount: unknown
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const orderIdResult = validateUUID(orderId);
  if (!orderIdResult.valid) errors.orderId = orderIdResult.error!;

  const amountResult = validateAmount(amount);
  if (!amountResult.valid) errors.amount = amountResult.error!;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
