import type { Config } from "tailwindcss"
import plugin from "tailwindcss/plugin"

const glassPlugin = plugin(({ addUtilities }) => {
	addUtilities({
	".glass-card": {
		"backdrop-filter": "blur(16px) saturate(180%)",
		"-webkit-backdrop-filter": "blur(16px) saturate(180%)",
		"background-color": "rgba(255,255,255,0.05)",
		border: "1px solid rgba(255,255,255,0.15)",
		"box-shadow": "0 4px 30px rgba(0,0,0,0.1)",
	},
	})
})

const config: Config = {
	darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
		background: "hsl(var(--background))",
		foreground: "hsl(var(--foreground))",
		card: {
			DEFAULT: "hsl(var(--card))",
			foreground: "hsl(var(--card-foreground))",
  		},
		popover: {
			DEFAULT: "hsl(var(--popover))",
			foreground: "hsl(var(--popover-foreground))",
		},
		primary: {
			DEFAULT: "hsl(var(--primary))",
			foreground: "hsl(var(--primary-foreground))",
		},
		secondary: {
			DEFAULT: "hsl(var(--secondary))",
			foreground: "hsl(var(--secondary-foreground))",
		},
		muted: {
			DEFAULT: "hsl(var(--muted))",
			foreground: "hsl(var(--muted-foreground))",
		},
		accent: {
			DEFAULT: "hsl(var(--accent))",
			foreground: "hsl(var(--accent-foreground))",
		},
		destructive: {
			DEFAULT: "hsl(var(--destructive))",
			foreground: "hsl(var(--destructive-foreground))",
		},
		border: "hsl(var(--border))",
		input: "hsl(var(--input))",
		ring: "hsl(var(--ring))",
		chart: {
			1: "hsl(var(--chart-1))",
			2: "hsl(var(--chart-2))",
			3: "hsl(var(--chart-3))",
			4: "hsl(var(--chart-4))",
			5: "hsl(var(--chart-5))",
		},
		brand: {
			gradientStart: "hsl(var(--brand-gradient-start))",
			gradientEnd: "hsl(var(--brand-gradient-end))",
		},
		},
  		borderRadius: {
		lg: "var(--radius)",
		md: "calc(var(--radius) - 2px)",
		sm: "calc(var(--radius) - 4px)",
		},
  },
	},
	plugins: [require("tailwindcss-animate"), glassPlugin],
}

export default config