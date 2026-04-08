export type SensitiveField = {
  key: string;
  label: string;
};

export type SensitiveConfig = {
  visibleCount: number;
} | null;

export const getSensitiveConfig = (field: SensitiveField): SensitiveConfig => {
  if (/(?:aadhaar)/i.test(field.key) || /(?:aadhaar)/i.test(field.label)) {
    return { visibleCount: 4 };
  }

  if (/(?:pan)/i.test(field.key) || /(?:pan)/i.test(field.label)) {
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
