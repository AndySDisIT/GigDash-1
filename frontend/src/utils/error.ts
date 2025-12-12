export const getErrorMessage = (err: unknown, defaultMessage = 'An error occurred'): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const error = err as { response?: { data?: { error?: string } } };
    return error.response?.data?.error || defaultMessage;
  }
  return defaultMessage;
};
