// Application-wide constants for LayerBoard

export const CANVAS = {
  MIN_SCALE: 0.1,
  MAX_SCALE: 4,
  SCALE_STEP: 0.1,
  WHEEL_ZOOM_FACTOR: 1.1,
  DEFAULT_SCALE: 1,
} as const;

// Default area size
export const AREA_DEFAULTS = {
  WIDTH: 480,
  HEIGHT: 360,
  HEADER_HEIGHT: 44,
  LAYER_TAB_HEIGHT: 36,
  PADDING: 16,
} as const;

// Default spacing when arranging areas in the four-direction layout
export const AREA_SPACING = 560;

// Sticky note presets
export const STICKY_COLORS = [
  '#ffeaa7', // yellow
  '#55efc4', // green
  '#fd79a8', // pink
  '#74b9ff', // blue
  '#fab1a0', // orange
  '#a29bfe', // purple
] as const;

export const STICKY_DEFAULTS = {
  WIDTH: 180,
  HEIGHT: 140,
} as const;

// Group color presets
export const GROUP_COLORS = [
  '#6C5CE7',
  '#00B894',
  '#E17055',
  '#0984E3',
  '#E84393',
  '#FDCB6E',
  '#00CEC9',
  '#6C5CE7',
] as const;

// Camera animation
export const CAMERA = {
  FLY_DURATION: 0.8, // seconds
  EASE: 'power2.inOut',
} as const;

// Timestamp format
export const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm';
