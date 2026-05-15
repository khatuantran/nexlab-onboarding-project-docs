import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "hsl(var(--primary-50))",
          100: "hsl(var(--primary-100))",
          200: "hsl(var(--primary-200))",
          300: "hsl(var(--primary-300))",
          400: "hsl(var(--primary-400))",
          500: "hsl(var(--primary-500))",
          600: "hsl(var(--primary-600))",
          700: "hsl(var(--primary-700))",
          800: "hsl(var(--primary-800))",
          900: "hsl(var(--primary-900))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          bg: "hsl(var(--secondary-bg))",
          text: "hsl(var(--secondary-text))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        canvas: {
          DEFAULT: "hsl(var(--canvas))",
          muted: "hsl(var(--canvas-muted))",
        },
        sage: {
          DEFAULT: "hsl(var(--sage))",
          foreground: "hsl(var(--sage-foreground))",
          bg: "hsl(var(--sage-bg))",
          text: "hsl(var(--sage-text))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        highlight: "hsl(var(--highlight))",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "var(--radius)",
        xl: "16px",
        "2xl": "60px",
      },
      boxShadow: {
        card: "0 2px 6px 0 rgb(0 0 0 / 0.12), 0 0 4px 0 rgb(0 0 0 / 0.04)",
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.08)",
        md: "0 2px 6px 0 rgb(0 0 0 / 0.12), 0 0 4px 0 rgb(0 0 0 / 0.04)",
        lg: "0 8px 24px 0 rgb(0 0 0 / 0.15)",
        tooltip: "0 2px 8px 0 rgb(0 0 0 / 0.15)",
      },
      fontFamily: {
        display: ['"Inter"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "sans-serif"],
        body: ['"Roboto"', '"Helvetica Neue"', "Arial", "sans-serif"],
        ui: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"Inter"',
          '"Segoe UI"',
          "sans-serif",
        ],
        sans: ['"Roboto"', '"Helvetica Neue"', "Arial", "sans-serif"],
      },
    },
  },
  plugins: [typography],
};
