export const BASE_URL = __DEV__
  ? 'http://192.168.10.5:3002' // machine IP for physical device
  : 'https://orion-api.nielless.com';

export const API_TIMEOUT = 30000; // 30 seconds

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@orion_auth_token',
  REFRESH_TOKEN: '@orion_refresh_token',
  USER_DATA: '@orion_user_data',
  MESSAGES: '@orion_messages',
  SETTINGS: '@orion_settings',
  ONBOARDING_COMPLETE: '@orion_onboarding_complete',
} as const;

// App Colors
export const COLORS = {
  primary: '#007AFF',
  primaryDark: '#0056CC',
  primaryLight: '#B4D7FF',

  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  backgroundTertiary: '#E9E9EB',

  // Text
  textPrimary: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',

  // Status
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',

  // Borders
  border: '#E0E0E0',
  borderDark: '#C0C0C0',

  // Chat
  userBubble: '#007AFF',
  assistantBubble: '#E9E9EB',

  // Misc
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

// Typography
export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
} as const;

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
} as const;

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  VOICE: 'voice',
} as const;

// Message Roles
export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_USERNAME_LENGTH: 30,
  MAX_MESSAGE_LENGTH: 1000,
} as const;

// Animation Durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Screen Names
export const SCREENS = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  CHAT: 'Chat',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Session expired. Please log in again.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in!',
  REGISTER: 'Account created successfully!',
  LOGOUT: 'Successfully logged out!',
  MESSAGE_SENT: 'Message sent!',
} as const;
