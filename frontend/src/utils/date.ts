import { format, parseISO } from 'date-fns';

export const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateString;
  }
};

export const formatDateForInput = (dateString: string): string => {
  try {
    return format(parseISO(dateString), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return dateString;
  }
};
