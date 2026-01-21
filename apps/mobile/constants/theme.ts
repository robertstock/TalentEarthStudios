/**
 * WME+ Design System Theme
 * Extracted from WME+ website - Dark, minimal, professional aesthetic
 */

import { Platform } from 'react-native';

// Legacy Colors export for backwards compatibility
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
    light: {
        text: '#11181C',
        background: '#fff',
        tint: tintColorLight,
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: tintColorLight,
    },
    dark: {
        text: '#ECEDEE',
        background: '#151718',
        tint: tintColorDark,
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: tintColorDark,
    },
};

export const Fonts = Platform.select({
    ios: {
        sans: 'system-ui',
        serif: 'ui-serif',
        rounded: 'ui-rounded',
        mono: 'ui-monospace',
    },
    default: {
        sans: 'normal',
        serif: 'serif',
        rounded: 'normal',
        mono: 'monospace',
    },
    web: {
        sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
        mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
});

/**
 * WME+ Brand Theme
 */
export const WME = {
    // Core Colors - Dark Theme
    // Core Colors - Dark Theme (High Contrast)
    colors: {
        // Backgrounds
        base: '#111827',           // Gray-900 (Lighter than pure black)
        panel: '#1f2937',          // Gray-800 (Distinct card background)
        panelAlt: '#374151',       // Gray-700 (Lighter panels)
        card: '#1f2937',           // Card background

        // Text
        text: '#f9fafb',           // Gray-50 (Bright white-ish)
        textMuted: '#d1d5db',      // Gray-300 (Much lighter than before)
        textSubtle: '#9ca3af',     // Gray-400
        textDim: '#6b7280',        // Gray-500

        // Borders
        border: '#374151',         // Gray-700 (Visible border)
        borderLight: '#4b5563',    // Gray-600

        // Accent Colors
        accent: '#3b82f6',         // Blue-500
        success: '#22c55e',        // Green-500
        successDim: '#14532d',     // Green-900
        warning: '#ffb020',        // Amber-500 (Brighter)
        error: '#ef4444',          // Red-500

        // Interactive States
        hover: '#374151',          // Gray-700
        active: '#4b5563',         // Gray-600
        pressed: '#111827',        // Gray-900

        // Status Colors
        statusActive: '#22c55e',   // Green pulse
        statusIdle: '#64748b',     // Gray
    },

    // Font Weights
    fontWeight: {
        light: '300' as const,
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    // Font Sizes
    fontSize: {
        xs: 10,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
    },

    // Spacing
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        '2xl': 24,
        '3xl': 32,
        '4xl': 40,
        '5xl': 48,
    },

    // Border Radius
    radius: {
        none: 0,
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        '2xl': 20,
        full: 9999,
    },

    // Letter Spacing (for uppercase labels)
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
        wider: 1,
        widest: 2,
        tracking: 3,  // For uppercase nav items
    },
};

// Shorthand exports
export const COLORS = WME.colors;
export const SPACING = WME.spacing;
export const FONT_SIZE = WME.fontSize;
export const RADIUS = WME.radius;
