import { useState, useCallback } from 'react';
import logger from '@/lib/logger';

export interface PaymentFormData {
  name: string;
  email: string;
}

export interface ValidationErrors {
  name?: string;
  email?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const usePaymentForm = () => {
  const [formData, setFormData] = useState<PaymentFormData>({
    name: '',
    email: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.trim().length > 100) return 'Name must not exceed 100 characters';
        return undefined;

      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address';
        return undefined;

      default:
        return undefined;
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, [validateField]);

  const validate = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.entries(formData).forEach(([name, value]) => {
      const error = validateField(name, value);
      if (error) {
        newErrors[name as keyof ValidationErrors] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (!isValid) {
      logger.warn('[PaymentForm] Validation failed', { errors: newErrors });
    }

    return isValid;
  }, [formData, validateField]);

  const reset = useCallback(() => {
    setFormData({ name: '', email: '' });
    setErrors({});
    setTouched({});
  }, []);

  const getFieldError = useCallback(
    (fieldName: keyof PaymentFormData): string | undefined => errors[fieldName],
    [errors]
  );

  const getFieldTouched = useCallback(
    (fieldName: keyof PaymentFormData): boolean => touched[fieldName] || false,
    [touched]
  );

  return {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    getFieldError,
    getFieldTouched,
  };
};
