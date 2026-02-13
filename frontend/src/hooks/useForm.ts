import { useState, useCallback } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  validate?: (values: T) => string | null;
}

interface UseFormReturn<T> {
  values: T;
  errors: string;
  submitting: boolean;
  handleChange: (field: keyof T) => (value: string) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: string) => void;
  resetForm: () => void;
}

/**
 * Custom hook for form handling with validation and submission
 */
export function useForm<T extends Record<string, string>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback(
    (field: keyof T) => (value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      if (errors) setErrors('');
    },
    [errors]
  );

  const setFieldValue = useCallback((field: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors('');
    setSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      setErrors('');

      // Validate if validation function provided
      if (validate) {
        const validationError = validate(values);
        if (validationError) {
          setErrors(validationError);
          return;
        }
      }

      setSubmitting(true);

      try {
        await onSubmit(values);
      } catch (err: any) {
        // Error handled by onSubmit
      } finally {
        setSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  return {
    values,
    errors,
    submitting,
    handleChange,
    handleSubmit,
    setFieldValue,
    resetForm,
  };
}
