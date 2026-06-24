/**
 * GoOne Brand Color Palette
 * Inspired by the GoOne logo: Blue "G", Purple location pin, Magenta/Burgundy text
 */

export const Colors = {
  // ── Primary Blue (Logo "G" color) ──────────────────────────
  blueDeep: '#0A4FA8',
  bluePrimary: '#1A6FD4',
  blueLight: '#4B9CF5',
  blueSoft: '#E8F2FF',

  // ── Primary Purple (Logo pin color) ────────────────────────
  purplePrimary: '#7B2FBE',
  purpleMedium: '#9B4DD4',
  purpleLight: '#C084FC',
  purpleSoft: '#F3E8FF',

  // ── Magenta / Brand Red (Logo text color) ──────────────────
  magentaPrimary: '#9B1D6E',
  magentaMedium: '#C2296F',
  magentaSoft: '#FDE8F4',

  // ── Success / Farmer Green ──────────────────────────────────
  greenPrimary: '#16A34A',
  greenLight: '#4ADE80',
  greenSoft: '#DCFCE7',

  // ── Warning / Daily Wage Orange ─────────────────────────────
  orangePrimary: '#EA580C',
  orangeLight: '#FB923C',
  orangeSoft: '#FFF3E0',

  // ── Emergency / Error Red ───────────────────────────────────
  redPrimary: '#DC2626',
  redLight: '#F87171',
  redSoft: '#FEE2E2',

  // ── Amber / Rating ──────────────────────────────────────────
  amberPrimary: '#D97706',
  amberLight: '#FCD34D',
  amberSoft: '#FEF3C7',

  // ── Neutrals ─────────────────────────────────────────────────
  white: '#FFFFFF',
  bgLight: '#F7F8FC',
  bgCard: '#FFFFFF',
  border: '#E8ECF4',
  textPrimary: '#1A1D3B',
  textSecondary: '#5A6080',
  textMuted: '#9DA3BD',
  dark: '#111827',

  // ── Transparent variants ─────────────────────────────────────
  overlayLight: 'rgba(255,255,255,0.15)',
  overlayDark: 'rgba(0,0,0,0.5)',
} as const;

/** Brand gradients as [startColor, endColor] tuples */
export const Gradients = {
  main: ['#1A6FD4', '#7B2FBE', '#9B1D6E'] as string[],
  blue: ['#1A6FD4', '#4B9CF5'] as string[],
  purple: ['#7B2FBE', '#C084FC'] as string[],
  green: ['#16A34A', '#4ADE80'] as string[],
  warm: ['#EA580C', '#D97706'] as string[],
  emergency: ['#DC2626', '#C2296F'] as string[],
};

export default Colors;
