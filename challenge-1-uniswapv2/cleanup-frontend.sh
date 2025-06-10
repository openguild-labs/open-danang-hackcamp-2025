#!/bin/bash

echo "🧹 Completely cleaning frontend..."

cd frontend

# Stop any running processes
pkill -f "next dev" 2>/dev/null || true

# Remove EVERYTHING that could cause conflicts
rm -rf app/ .next/ node_modules/ package-lock.json .turbo/ .cache/ dist/ build/
rm -rf providers.tsx *.config.js *.config.ts

echo "📁 Recreating clean structure..."

# Ensure only correct structure exists
mkdir -p src/app src/config public

# Remove any existing package.json and create clean one
cat > package.json << 'EOF'
{
  "name": "uniswap-v2-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.29",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "ethers": "^6.8.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.51.0",
    "eslint-config-next": "14.2.29",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2"
  }
}
EOF

# Create clean CSS
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
}
EOF

# Create layout
cat > src/app/layout.tsx << 'EOF'
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'UniswapV2 DEX',
  description: 'Decentralized Exchange for Polkadot Asset Hub',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
EOF

# Create configs
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
EOF

cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create contracts config
cat > src/config/contracts.json << 'EOF'
{
  "factory": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "tokenA": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  "tokenB": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  "pair": "0x68F1EF64B6A473E6e782871e4F98B2AaD2bbaD95"
}
EOF

echo "📦 Installing dependencies..."
npm install

echo "✅ Frontend completely reset!"
echo ""
echo "📁 Final structure:"
find . -type f -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.js" -o -name "*.css" | head -15
echo ""
echo "🚀 Now run: npm run dev"
EOF

chmod +x cleanup-frontend.sh
