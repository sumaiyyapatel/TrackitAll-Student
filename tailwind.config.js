/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
		content: [
		"./src/**/*.{js,jsx,ts,tsx}"
	],
  theme: {
  	extend: {
  		fontSize: {
  			'h1': ['36px', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],
  			'h2': ['26px', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.01em' }],
  			'h3': ['18px', { lineHeight: '1.3', fontWeight: '600' }],
  			'body': ['14px', { lineHeight: '1.6' }],
  			'body-sm': ['13px', { lineHeight: '1.5' }],
  			'caption': ['11px', { lineHeight: '1.4', fontWeight: '500' }],
  			'overline': ['10px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.1em' }],
  		},
  		spacing: {
  			'1': '4px',
  			'2': '8px',
  			'3': '12px',
  			'4': '16px',
  			'5': '20px',
  			'6': '24px',
  			'8': '32px',
  			'10': '40px',
  			'12': '48px',
  		},
  		maxWidth: {
  			'container': '1200px',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			'bg-card': 'hsl(var(--card))',
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			success: '#10b981',
  			warning: '#f59e0b',
  			danger: '#ef4444',
  			info: '#06b6d4',
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'collapsible-down': {
  				from: {
  					height: '0',
  					opacity: '0'
  				},
  				to: {
  					height: 'var(--radix-collapsible-content-height)',
  					opacity: '1'
  				}
  			},
  			'collapsible-up': {
  				from: {
  					height: 'var(--radix-collapsible-content-height)',
  					opacity: '1'
  				},
  				to: {
  					height: '0',
  					opacity: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'collapsible-down': 'collapsible-down 0.3s ease-out',
  			'collapsible-up': 'collapsible-up 0.3s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};