import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base:      'var(--bg-base)',
        card:      'var(--bg-card)',
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        border:    'var(--border-color)',
        accent:    '#6366F1',
        danger:    '#F43F5E',
        success:   '#10B981',
        warning:   '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-accent':  '0 0 24px rgba(99, 102, 241, 0.2)',
        'glow-danger':  '0 0 24px rgba(244, 63, 94, 0.2)',
      },
    },
  },
  plugins: [],
} satisfies Config;
