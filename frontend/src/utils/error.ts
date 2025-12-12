export const getErrorMessage = (err: unknown): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const error = err as { response?: { data?: { error?: string } } };
    return error.response?.data?.error || 'An error occurred';
  }
  return 'An error occurred';
};
