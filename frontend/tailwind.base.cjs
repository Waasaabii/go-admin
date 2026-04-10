/** @type {import('tailwindcss').Config} */
const sharedTheme = {
  extend: {
    borderRadius: {
      lg: "var(--radius, 1rem)",
      md: "var(--radius-md, calc(var(--radius, 1rem) - 2px))",
      sm: "var(--radius-sm, calc(var(--radius, 1rem) - 6px))",
      control: "var(--radius-control, 0.625rem)",
      surface: "var(--radius-surface, 0.5rem)",
      overlay: "var(--radius-overlay, 0.75rem)",
    },
    boxShadow: {
      card: "var(--shadow-card)",
      soft: "var(--shadow-soft)",
    },
    colors: {
      accent: {
        DEFAULT: "hsl(var(--accent))",
        foreground: "hsl(var(--accent-foreground))",
      },
      background: "hsl(var(--background))",
      border: "hsl(var(--border))",
      card: {
        DEFAULT: "hsl(var(--card))",
        foreground: "hsl(var(--card-foreground))",
      },
      destructive: {
        DEFAULT: "hsl(var(--destructive))",
        foreground: "hsl(var(--destructive-foreground))",
      },
      foreground: "hsl(var(--foreground))",
      input: "hsl(var(--input))",
      muted: {
        DEFAULT: "hsl(var(--muted))",
        foreground: "hsl(var(--muted-foreground))",
      },
      popover: {
        DEFAULT: "hsl(var(--popover))",
        foreground: "hsl(var(--popover-foreground))",
      },
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      ring: "hsl(var(--ring))",
      secondary: {
        DEFAULT: "hsl(var(--secondary))",
        foreground: "hsl(var(--secondary-foreground))",
      },
    },
    fontFamily: {
      display: ["var(--font-display)"],
      sans: ["var(--font-sans)"],
    },
  },
};

function createAppTailwindConfig(extraContent = []) {
  return {
    content: [
      "./index.html",
      "./src/**/*.{ts,tsx}",
      "../../packages/ui-admin/src/**/*.{ts,tsx}",
      ...extraContent,
    ],
    darkMode: ["class"],
    theme: sharedTheme,
    plugins: [],
  };
}

module.exports = {
  createAppTailwindConfig,
  sharedTheme,
};
