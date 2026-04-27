export type SensitiveField = {
  key: string;
  label: string;
};

export type SensitiveConfig = {
  visibleCount: number;
} | null;

export const getSensitiveConfig = (field: SensitiveField): SensitiveConfig => {
  const key = field.key.toLowerCase();
  const label = field.label.toLowerCase();

  if (key.includes('aadhaar') || label.includes('aadhaar')) {
    return { visibleCount: 4 };
  }

  if (key.includes('pan') || label.includes('pan')) {
    return { visibleCount: 2 };
  }

  return null;
};

export const maskValue = (value: string, visibleCount: number): string => {
  if (!value) {
    return '';
  }

  const normalized = value.toString();
  if (normalized.length <= visibleCount) {
    return normalized;
  }

  return '*'.repeat(normalized.length - visibleCount) + normalized.slice(-visibleCount);
};

export const getDisplayValue = (
  field: SensitiveField,
  value: string,
  showSensitive?: boolean
): string => {
  const config = getSensitiveConfig(field);
  if (!config || showSensitive) {
    return value;
  }

  return maskValue(value, config.visibleCount);
};

export const validateFieldInput = (fieldKey: string, inputValue: string): string => {
  const key = fieldKey.toLowerCase();

  // Aadhaar Number - only 12 digits max
  if (key.includes('aadhaar')) {
    const digitsOnly = inputValue.replace(/[^0-9]/g, '');
    return digitsOnly.slice(0, 12);
  }

  // PAN Number - alphanumeric only, max 10 characters
  if (key.includes('pan')) {
    const alphanumericOnly = inputValue.replace(/[^0-9A-Za-z]/g, '');
    return alphanumericOnly.slice(0, 10).toUpperCase();
  }

  // Date of Birth - only digits, slashes, and dashes, max 10 characters (DD/MM/YYYY)
  if (key.includes('dob') || (key.includes('date') && key.includes('birth'))) {
    const cleanedValue = inputValue.replace(/[^0-9/\-]/g, '');
    return cleanedValue.slice(0, 10);
  }

  // Mobile/Phone - only digits, max 10 digits
  if (key.includes('mobile') || key.includes('phone') || key.includes('contact')) {
    const digitsOnly = inputValue.replace(/[^0-9]/g, '');
    return digitsOnly.slice(0, 10);
  }

  // By default, return input as-is
  return inputValue;
};

export const getMaxLengthForField = (fieldKey: string): number | undefined => {
  const key = fieldKey.toLowerCase();

  // Aadhaar Number - 12 digits max
  if (key.includes('aadhaar')) {
    return 12;
  }

  // PAN Number - 10 characters max
  if (key.includes('pan')) {
    return 10;
  }

  // Date of Birth - 10 characters max (DD/MM/YYYY)
  if (key.includes('dob') || (key.includes('date') && key.includes('birth'))) {
    return 10;
  }

  // Mobile/Phone - 10 digits max
  if (key.includes('mobile') || key.includes('phone') || key.includes('contact')) {
    return 10;
  }

  // No limit by default
  return undefined;
};
