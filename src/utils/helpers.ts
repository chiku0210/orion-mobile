import { COLORS } from './constants';

// Date/Time formatting helpers
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

export const isYesterday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
};

export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (isYesterday(dateString)) {
    return 'Yesterday';
  } else {
    return formatDate(dateString);
  }
};

// String helpers
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) {return str;}
  return str.substring(0, maxLength - 3) + '...';
};

export const capitalizeFirst = (str: string): string => {
  if (!str) {return '';}
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const capitalizeWords = (str: string): string => {
  return str.split(' ').map(capitalizeFirst).join(' ');
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/<[^>]*>/g, '');
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// Password strength checker
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;

  if (password.length >= 6) {score++;}
  if (password.length >= 10) {score++;}
  if (/[a-z]/.test(password)) {score++;}
  if (/[A-Z]/.test(password)) {score++;}
  if (/[0-9]/.test(password)) {score++;}
  if (/[^a-zA-Z0-9]/.test(password)) {score++;}

  if (score <= 2) {
    return { score, label: 'Weak', color: COLORS.error };
  } else if (score <= 4) {
    return { score, label: 'Medium', color: COLORS.warning };
  } else {
    return { score, label: 'Strong', color: COLORS.success };
  }
};

// Number formatting
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {clearTimeout(timeout);}
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj: any): boolean => {
  if (obj == null) {return true;}
  if (Array.isArray(obj) || typeof obj === 'string') {return obj.length === 0;}
  return Object.keys(obj).length === 0;
};

// Get initials from name
export const getInitials = (name: string): string => {
  const names = name.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// Platform-specific helpers
export const isIOS = (): boolean => {
  const { Platform } = require('react-native');
  return Platform.OS === 'ios';
};

export const isAndroid = (): boolean => {
  const { Platform } = require('react-native');
  return Platform.OS === 'android';
};

// Message helpers
export const getMessagePreview = (message: string, maxLength: number = 50): string => {
  const lines = message.split('\n');
  const firstLine = lines[0];
  return truncate(firstLine, maxLength);
};

// Group messages by date
export const groupMessagesByDate = <T extends { createdAt: string }>(
  messages: T[]
): { date: string; messages: T[] }[] => {
  const groups: Map<string, T[]> = new Map();

  messages.forEach((message) => {
    const dateKey = formatDate(message.createdAt);
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, message]);
  });

  return Array.from(groups.entries()).map(([date, msgs]) => ({
    date,
    messages: msgs,
  }));
};

// Storage size formatter
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) {return '0 Bytes';}

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Delay helper
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Async helper with timeout
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: Error = new Error('Operation timed out')
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(timeoutError), timeoutMs)),
  ]);
};

export default {
  formatTime,
  formatDate,
  formatDateTime,
  isToday,
  isYesterday,
  getRelativeTime,
  truncate,
  capitalizeFirst,
  capitalizeWords,
  sanitizeInput,
  generateId,
  isValidEmail,
  isValidUsername,
  isValidPassword,
  getPasswordStrength,
  formatNumber,
  debounce,
  throttle,
  deepClone,
  isEmpty,
  getInitials,
  isIOS,
  isAndroid,
  getMessagePreview,
  groupMessagesByDate,
  formatBytes,
  delay,
  withTimeout,
};
