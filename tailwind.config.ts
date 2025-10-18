import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dim White Theme - Professional & Easy on Eyes
        background: '#F8F9FA',        // Very light gray (main background)
        foreground: '#1A1D1F',        // Almost black (text)

        primary: {
          DEFAULT: '#2E7D32',         // Estate green
          foreground: '#FFFFFF',      // White text on green
          50: '#E8F5E9',
          100: '#C8E6C9',
          500: '#2E7D32',
          600: '#1B5E20',
          700: '#154D1A',
        },

        secondary: {
          DEFAULT: '#546E7A',         // Muted blue-gray
          foreground: '#FFFFFF',
          50: '#ECEFF1',
          100: '#CFD8DC',
          500: '#546E7A',
          600: '#455A64',
        },

        accent: {
          DEFAULT: '#FFA726',         // Warm amber (alerts, highlights)
          foreground: '#FFFFFF',
          50: '#FFF3E0',
          100: '#FFE0B2',
          500: '#FFA726',
          600: '#FB8C00',
        },

        muted: {
          DEFAULT: '#E0E0E0',         // Light gray (disabled states)
          foreground: '#757575',      // Medium gray text
        },

        card: {
          DEFAULT: '#FFFFFF',         // White cards
          foreground: '#1A1D1F',
        },

        border: '#E0E0E0',            // Subtle borders
        input: '#F5F5F5',             // Input background
        ring: '#2E7D32',              // Focus ring (primary)

        // Status colors
        success: '#2E7D32',           // Green
        warning: '#FFA726',           // Amber
        error: '#D32F2F',             // Red
        info: '#1976D2',              // Blue
      },

      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '6px',
      },

      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.10)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config