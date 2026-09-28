import { CURRENCY } from './constants';

export const formatPrice = (price) => {
  const value = Number(price) || 0;
  if (value === 0) return 'Free';
  return `${CURRENCY.SYMBOL}${value.toLocaleString()}`;
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDuration = (seconds) => {
  const total = Number(seconds) || 0;
  if (total <= 0) return '';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const formatPercent = (value) => {
  const n = Number(value) || 0;
  return `${Math.round(n)}%`;
};