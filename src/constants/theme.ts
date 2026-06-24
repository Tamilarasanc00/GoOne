import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import Colors from './colors';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.bluePrimary,
    secondary: Colors.purplePrimary,
    tertiary: Colors.magentaPrimary,
    background: Colors.bgLight,
    surface: Colors.bgCard,
    surfaceVariant: Colors.bgLight,
    onSurface: Colors.textPrimary,
    onSurfaceVariant: Colors.textSecondary,
    outline: Colors.border,
    outlineVariant: Colors.border,
    error: Colors.redPrimary,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.blueLight,
    secondary: Colors.purpleLight,
    tertiary: Colors.magentaMedium,
    background: '#0F1020',
    surface: '#1A1D3B',
    onSurface: '#F0F4FF',
    onSurfaceVariant: Colors.textMuted,
    outline: '#2E3150',
    outlineVariant: '#2E3150',
    error: Colors.redLight,
  },
};

export type AppTheme = typeof lightTheme;
