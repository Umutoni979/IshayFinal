import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatDate     = (date) => date ? format(parseISO(date), 'MMM dd, yyyy') : '—';
export const formatDateTime = (date) => date ? format(parseISO(date), 'MMM dd, yyyy HH:mm') : '—';
export const formatTime     = (time) => {
  if (!time) return '—';
  const [h, m] = time.split(':');
  const d = new Date();
  d.setHours(h, m);
  return format(d, 'h:mm a');
};
export const timeAgo = (date) => date ? formatDistanceToNow(parseISO(date), { addSuffix: true }) : '—';
