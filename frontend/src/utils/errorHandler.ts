export const getErrorMessage = (
  err: any,
  defaultMessage: string = 'An error occurred'
): string => {
  if (!err) return defaultMessage;

  if (typeof err === 'string') {
    return err;
  }

  if (err instanceof Error) {
    return err.message;
  }

  if (typeof err === 'object') {
    if (err.status === 401) return 'Please log in';
    if (err.status === 403) return 'You do not have permission to access this resource';
    if (err.status === 404) return 'Resource not found';
    if (err.status === 409) return 'Conflict: Resource already exists or action cannot be completed';
    if (err.status === 500) return 'Server error. Please try again later.';
    if (err.status && err.status >= 500) return 'Server error. Please try again later.';

    if (err.data) {
      if (typeof err.data === 'string') return err.data;
      if (typeof err.data === 'object') {
        if (err.data.error) return String(err.data.error);
        if (err.data.message) return String(err.data.message);
        if (err.data.msg) return String(err.data.msg);
      }
    }

    if (err.error) return String(err.error);

    if (err.message) return String(err.message);
  }

  return defaultMessage;
};
export const formatApiError = (error: any): string => {
  const message = getErrorMessage(error);

  if (message && !message.includes('[object') && message.length > 0) {
    return message;
  }

  return 'An unexpected error occurred. Please try again.';
};
